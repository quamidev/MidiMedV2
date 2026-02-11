'use server'

/**
 * Billing Server Actions
 *
 * Handles billing operations including plan catalog retrieval, current plan status,
 * checkout session creation, and invoice listing. Uses the Recurrente payment
 * gateway for Latin American payment processing.
 *
 * Created: 2026-02-10 - MV2-044 Billing server actions
 */

import { z } from 'zod'

import { createServerClient } from '@/lib/supabase/server'
import { createCheckout } from '@/lib/recurrente/client'
import type {
  ActionResult,
  BillingPlan,
  BillingStatus,
  PlanCatalogEntry,
  CurrentPlanInfo,
  Invoice,
} from '@/types/app'

// Note: Types (PlanCatalogEntry, CurrentPlanInfo, Invoice) are defined in '@/types/app'

/**
 * Result of creating a checkout session.
 */
export interface CreateCheckoutResult {
  invoiceId: string
  checkoutUrl: string
}

// =============================================================================
// Validation Schemas
// =============================================================================

const createCheckoutSchema = z.object({
  planId: z.string().min(1, 'Plan ID es requerido'),
  currency: z.enum(['GTQ', 'USD'], { message: 'Moneda inválida' }),
})

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Gets the current user and their tenant_id from the authenticated session.
 * Throws an error if not authenticated.
 */
async function getCurrentUserContext() {
  const supabase = await createServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    throw new Error('No autenticado')
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, tenant_id, email')
    .eq('auth_id', authUser.id)
    .single()

  if (userError || !user) {
    throw new Error('Usuario no encontrado')
  }

  return {
    supabase,
    tenantId: user.tenant_id as string,
    userId: user.id as string,
    userEmail: user.email as string,
  }
}

// =============================================================================
// Query Actions
// =============================================================================

/**
 * Gets the available plan catalog.
 *
 * Retrieves all active plans from the plan_catalog table.
 * This is publicly accessible (no auth required) as it's used on pricing pages.
 *
 * @returns ActionResult with array of plan catalog entries
 */
export async function getPlanCatalog(): Promise<ActionResult<PlanCatalogEntry[]>> {
  try {
    const supabase = await createServerClient()

    const { data: plans, error } = await supabase
      .from('plan_catalog')
      .select('*')
      .eq('active', true)
      .order('price', { ascending: true })

    if (error) {
      console.error('getPlanCatalog error:', error)
      return { success: false, error: 'Error al obtener catalogo de planes' }
    }

    return {
      success: true,
      data: (plans || []) as PlanCatalogEntry[],
    }
  } catch (error) {
    console.error('getPlanCatalog error:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

/**
 * Gets the current billing plan and status for the authenticated tenant.
 *
 * @returns ActionResult with current plan information
 */
export async function getCurrentPlan(): Promise<ActionResult<CurrentPlanInfo>> {
  try {
    const { supabase, tenantId } = await getCurrentUserContext()

    const { data: tenant, error } = await supabase
      .from('tenants')
      .select(`
        billing_plan,
        billing_status,
        trial_start_at,
        trial_days,
        purchased_at,
        paid_through,
        provider_subscription_id
      `)
      .eq('tenant_id', tenantId)
      .single()

    if (error || !tenant) {
      console.error('getCurrentPlan error:', error)
      return { success: false, error: 'Organización no encontrada' }
    }

    return {
      success: true,
      data: tenant as CurrentPlanInfo,
    }
  } catch (error) {
    console.error('getCurrentPlan error:', error)
    if (error instanceof Error && error.message === 'No autenticado') {
      return { success: false, error: 'No autenticado' }
    }
    return { success: false, error: 'Error inesperado' }
  }
}

/**
 * Gets the invoice history for the authenticated tenant.
 *
 * @param limit - Maximum number of invoices to return (default: 20)
 * @returns ActionResult with array of invoices
 */
export async function getInvoices(
  limit: number = 20
): Promise<ActionResult<Invoice[]>> {
  try {
    const { supabase, tenantId } = await getCurrentUserContext()

    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('getInvoices error:', error)
      return { success: false, error: 'Error al obtener facturas' }
    }

    return {
      success: true,
      data: (invoices || []) as Invoice[],
    }
  } catch (error) {
    console.error('getInvoices error:', error)
    if (error instanceof Error && error.message === 'No autenticado') {
      return { success: false, error: 'No autenticado' }
    }
    return { success: false, error: 'Error inesperado' }
  }
}

// =============================================================================
// Checkout Actions
// =============================================================================

/**
 * Creates a checkout session for plan purchase.
 *
 * This action:
 * 1. Validates the plan exists and is active
 * 2. Creates an invoice record with 'pending' status
 * 3. Calls Recurrente API to create a checkout session
 * 4. Updates the invoice with the checkout link info
 * 5. Returns the checkout URL for redirect
 *
 * @param input - Plan ID and currency for the checkout
 * @returns ActionResult with checkout URL
 */
export async function createCheckoutSession(
  input: { planId: string; currency: 'GTQ' | 'USD' }
): Promise<ActionResult<CreateCheckoutResult>> {
  try {
    const validated = createCheckoutSchema.parse(input)
    const { supabase, tenantId, userEmail } = await getCurrentUserContext()

    // Fetch the plan from catalog
    const catalogId = `${validated.planId}_${validated.currency}`
    const { data: plan, error: planError } = await supabase
      .from('plan_catalog')
      .select('*')
      .eq('id', catalogId)
      .eq('active', true)
      .single()

    if (planError || !plan) {
      console.error('Plan not found:', catalogId)
      return { success: false, error: 'Plan no encontrado o no disponible' }
    }

    // Validate Recurrente product/price IDs exist
    if (!plan.recurrente_product_id || !plan.recurrente_price_id) {
      console.error('Plan missing Recurrente IDs:', plan)
      return { success: false, error: 'Plan no configurado para pagos' }
    }

    // Calculate billing period (monthly)
    const periodStart = new Date()
    const periodEnd = new Date()
    periodEnd.setMonth(periodEnd.getMonth() + 1)

    // Create invoice record with pending status
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        tenant_id: tenantId,
        product: plan.plan,
        amount: plan.price,
        currency: plan.currency,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
        status: 'pending',
        provider: 'recurrente',
        description: `${plan.product_name || plan.plan} - ${plan.currency}`,
        due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Due in 7 days
      })
      .select()
      .single()

    if (invoiceError || !invoice) {
      console.error('Invoice creation error:', invoiceError)
      return { success: false, error: 'Error al crear factura' }
    }

    // Create Recurrente checkout session
    const checkoutResult = await createCheckout({
      productId: plan.recurrente_product_id,
      priceId: plan.recurrente_price_id,
      amount: plan.price,
      currency: plan.currency,
      email: userEmail,
      metadata: {
        tenant_id: tenantId,
        invoice_id: invoice.id,
        plan: plan.plan,
      },
    })

    if (!checkoutResult.success) {
      // Mark invoice as failed if checkout creation fails
      await supabase
        .from('invoices')
        .update({ status: 'failed' })
        .eq('id', invoice.id)

      return { success: false, error: checkoutResult.error }
    }

    // Update invoice with checkout link information
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        provider_link_id: checkoutResult.data.id,
        provider_link_url: checkoutResult.data.checkout_url,
      })
      .eq('id', invoice.id)

    if (updateError) {
      console.error('Invoice update error:', updateError)
      // Don't fail the request, the checkout was created successfully
    }

    return {
      success: true,
      data: {
        invoiceId: invoice.id,
        checkoutUrl: checkoutResult.data.checkout_url,
      },
    }
  } catch (error) {
    console.error('createCheckoutSession error:', error)
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError
      return { success: false, error: zodError.issues[0]?.message ?? 'Datos inválidos' }
    }
    if (error instanceof Error) {
      if (error.message === 'No autenticado') {
        return { success: false, error: 'No autenticado' }
      }
      if (error.message.includes('RECURRENTE')) {
        return { success: false, error: 'Servicio de pagos no disponible' }
      }
    }
    return { success: false, error: 'Error inesperado' }
  }
}
