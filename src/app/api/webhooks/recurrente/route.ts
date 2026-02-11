/**
 * API Route: Recurrente Payment Webhook Handler
 *
 * Receives and processes payment events from Recurrente payment gateway.
 * Handles payment success/failure, subscription creation, and updates
 * tenant billing status accordingly.
 *
 * Security:
 * - Verifies Svix webhook signatures before processing
 * - Logs all events to payment_events table for audit trail
 * - Uses supabaseAdmin to bypass RLS for cross-tenant updates
 *
 * Created: 2026-02-10 - MV2-045 Payment webhook handler
 */

import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'

import { supabaseAdmin } from '@/lib/supabase/admin'

// =============================================================================
// Types
// =============================================================================

/**
 * Base event metadata structure.
 */
interface EventMetadata {
  tenant_id?: string
  invoice_id?: string
  plan?: string
}

/**
 * Payment intent event data structure from Recurrente.
 */
interface PaymentIntentEvent {
  type: 'payment_intent.succeeded' | 'payment_intent.failed'
  data: {
    id: string
    object: 'payment_intent'
    amount: number
    currency: string
    status: string
    metadata?: EventMetadata
    checkout_id?: string
  }
}

/**
 * Subscription event data structure from Recurrente.
 */
interface SubscriptionEvent {
  type: 'subscription.create'
  data: {
    id: string
    object: 'subscription'
    status: string
    customer_email?: string
    current_period_start?: string
    current_period_end?: string
    metadata?: EventMetadata
  }
}

/**
 * Generic event for unhandled event types.
 */
interface GenericEvent {
  type: string
  data?: {
    id?: string
    metadata?: EventMetadata
    checkout_id?: string
  }
}

type RecurrenteEvent = PaymentIntentEvent | SubscriptionEvent | GenericEvent

// =============================================================================
// Webhook Verification
// =============================================================================

/**
 * Verifies the webhook signature using Svix.
 *
 * @param body - Raw request body
 * @param headers - Svix headers from the request
 * @returns Verified event payload or null if verification fails
 */
function verifyWebhookSignature(
  body: string,
  headers: {
    'svix-id': string
    'svix-timestamp': string
    'svix-signature': string
  }
): RecurrenteEvent | null {
  const webhookSecret = process.env.RECURRENTE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('RECURRENTE_WEBHOOK_SECRET is not configured')
    return null
  }

  try {
    const wh = new Webhook(webhookSecret)
    const event = wh.verify(body, headers) as RecurrenteEvent
    return event
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return null
  }
}

// =============================================================================
// Event Handlers
// =============================================================================

/**
 * Handles successful payment intent.
 *
 * Updates:
 * - Invoice status to 'paid'
 * - Tenant billing_plan to the purchased plan
 * - Tenant billing_status to 'PAID_ACTIVE'
 * - Tenant purchased_at and paid_through dates
 */
async function handlePaymentSuccess(event: PaymentIntentEvent) {
  const { data } = event
  const tenantId = data.metadata?.tenant_id
  const invoiceId = data.metadata?.invoice_id
  const plan = data.metadata?.plan

  if (!tenantId) {
    console.error('Payment success missing tenant_id in metadata:', data)
    return
  }

  const now = new Date().toISOString()

  // Calculate paid_through date (1 month from now for monthly billing)
  const paidThrough = new Date()
  paidThrough.setMonth(paidThrough.getMonth() + 1)

  // Update invoice if we have the ID
  if (invoiceId) {
    const { error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .update({
        status: 'paid',
        provider_payment_id: data.id,
        paid_at: now,
      })
      .eq('id', invoiceId)

    if (invoiceError) {
      console.error('Error updating invoice:', invoiceError)
    }
  }

  // Update tenant billing status
  const updateData: Record<string, unknown> = {
    billing_status: 'PAID_ACTIVE',
    purchased_at: now,
    paid_through: paidThrough.toISOString(),
    updated_at: now,
  }

  // Update billing plan if specified in metadata
  if (plan && ['BASIC', 'PRO', 'ENTERPRISE'].includes(plan)) {
    updateData.billing_plan = plan
  }

  const { error: tenantError } = await supabaseAdmin
    .from('tenants')
    .update(updateData)
    .eq('tenant_id', tenantId)

  if (tenantError) {
    console.error('Error updating tenant billing:', tenantError)
  }

  console.log(`Payment success processed for tenant: ${tenantId}`)
}

/**
 * Handles failed payment intent.
 *
 * Updates:
 * - Invoice status to 'failed'
 */
async function handlePaymentFailed(event: PaymentIntentEvent) {
  const { data } = event
  const invoiceId = data.metadata?.invoice_id

  if (!invoiceId) {
    console.error('Payment failed missing invoice_id in metadata:', data)
    return
  }

  const { error } = await supabaseAdmin
    .from('invoices')
    .update({
      status: 'failed',
      provider_payment_id: data.id,
    })
    .eq('id', invoiceId)

  if (error) {
    console.error('Error updating invoice for failed payment:', error)
  }

  console.log(`Payment failure processed for invoice: ${invoiceId}`)
}

/**
 * Handles subscription creation.
 *
 * Updates:
 * - Tenant provider_subscription_id with the new subscription ID
 */
async function handleSubscriptionCreated(event: SubscriptionEvent) {
  const { data } = event
  const tenantId = data.metadata?.tenant_id

  if (!tenantId) {
    console.error('Subscription create missing tenant_id in metadata:', data)
    return
  }

  const { error } = await supabaseAdmin
    .from('tenants')
    .update({
      provider_subscription_id: data.id,
      updated_at: new Date().toISOString(),
    })
    .eq('tenant_id', tenantId)

  if (error) {
    console.error('Error updating tenant subscription ID:', error)
  }

  console.log(`Subscription created for tenant: ${tenantId}, subscription: ${data.id}`)
}

// =============================================================================
// Route Handler
// =============================================================================

/**
 * POST /api/webhooks/recurrente
 *
 * Receives payment webhook events from Recurrente.
 *
 * Required headers:
 * - svix-id: Unique event ID
 * - svix-timestamp: Event timestamp
 * - svix-signature: HMAC signature for verification
 *
 * Processed events:
 * - payment_intent.succeeded: Updates invoice and tenant billing
 * - payment_intent.failed: Updates invoice status to failed
 * - subscription.create: Stores subscription ID on tenant
 *
 * Response:
 * - 200: Event received and processed
 * - 401: Invalid signature
 * - 500: Processing error
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text()

    // Extract Svix headers
    const svixId = request.headers.get('svix-id') || ''
    const svixTimestamp = request.headers.get('svix-timestamp') || ''
    const svixSignature = request.headers.get('svix-signature') || ''

    // Verify signature
    const event = verifyWebhookSignature(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Extract tenant_id and invoice_id from event for logging
    let tenantId: string | undefined
    let invoiceId: string | undefined
    let linkId: string | undefined
    let paymentId: string | undefined

    if ('data' in event && event.data) {
      const metadata = event.data.metadata
      tenantId = metadata?.tenant_id
      invoiceId = metadata?.invoice_id
      paymentId = event.data.id

      // For payment intents, also capture checkout_id as link_id
      if (event.type.startsWith('payment_intent.')) {
        linkId = (event.data as PaymentIntentEvent['data']).checkout_id
      }
    }

    // Log event to payment_events table (audit trail)
    const { error: logError } = await supabaseAdmin
      .from('payment_events')
      .insert({
        event_id: svixId,
        provider: 'recurrente',
        type: event.type,
        verified: true,
        tenant_id: tenantId || null,
        invoice_id: invoiceId || null,
        link_id: linkId || null,
        payment_id: paymentId || null,
        payload: JSON.parse(body),
      })

    if (logError) {
      // Check for duplicate event (idempotency)
      if (logError.code === '23505') {
        // Unique constraint violation - event already processed
        console.log(`Duplicate event ignored: ${svixId}`)
        return NextResponse.json({ received: true })
      }
      console.error('Error logging payment event:', logError)
    }

    // Process event by type
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event as PaymentIntentEvent)
        break

      case 'payment_intent.failed':
        await handlePaymentFailed(event as PaymentIntentEvent)
        break

      case 'subscription.create':
        await handleSubscriptionCreated(event as SubscriptionEvent)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
