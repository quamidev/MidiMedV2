/**
 * Recurrente API Client
 *
 * Client library for interacting with the Recurrente payment gateway API.
 * Handles checkout session creation and subscription management for
 * Latin American payment processing.
 *
 * Created: 2026-02-10 - MV2-044 Billing server actions
 */

// =============================================================================
// Configuration
// =============================================================================

const RECURRENTE_BASE = process.env.RECURRENTE_API_BASE || 'https://api.recurrente.com'
const PUBLIC_KEY = process.env.RECURRENTE_PUBLIC_KEY_PROD
const SECRET_KEY = process.env.RECURRENTE_SECRET_KEY

// =============================================================================
// Types
// =============================================================================

/**
 * Parameters for creating a checkout session.
 */
export interface CreateCheckoutParams {
  /** Product ID from plan_catalog.recurrente_product_id */
  productId: string
  /** Price ID from plan_catalog.recurrente_price_id */
  priceId: string
  /** Amount in centavos (e.g., 50000 for Q500.00) */
  amount: number
  /** Currency code (GTQ or USD) */
  currency: string
  /** Customer email for checkout */
  email: string
  /** Metadata to include with checkout (e.g., tenantId, invoiceId) */
  metadata: Record<string, string>
}

/**
 * Response from Recurrente checkout creation.
 */
export interface CreateCheckoutResponse {
  id: string
  checkout_url: string
  status: string
}

/**
 * Subscription data from Recurrente API.
 */
export interface SubscriptionData {
  id: string
  status: string
  customer_email: string
  current_period_start: string
  current_period_end: string
  plan: {
    id: string
    name: string
    amount: number
    currency: string
  }
}

/**
 * Result type for Recurrente API calls.
 */
export type RecurrenteResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Validates that required API keys are configured.
 * Throws an error if keys are missing.
 */
function validateConfig(): void {
  if (!PUBLIC_KEY) {
    throw new Error('RECURRENTE_PUBLIC_KEY_PROD is not configured')
  }
  if (!SECRET_KEY) {
    throw new Error('RECURRENTE_SECRET_KEY is not configured')
  }
}

/**
 * Creates headers for Recurrente API requests.
 */
function createHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-PUBLIC-KEY': PUBLIC_KEY!,
    'X-SECRET-KEY': SECRET_KEY!,
  }
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Creates a checkout session for a plan purchase.
 *
 * Generates a payment link that redirects the customer to Recurrente's
 * hosted checkout page. After payment, the customer is redirected to
 * our success/cancel/failed pages.
 *
 * @param params - Checkout parameters including amount, currency, and metadata
 * @returns Result with checkout URL or error message
 */
export async function createCheckout(
  params: CreateCheckoutParams
): Promise<RecurrenteResult<CreateCheckoutResponse>> {
  try {
    validateConfig()

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const response = await fetch(`${RECURRENTE_BASE}/checkouts`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({
        items: [
          {
            price_id: params.priceId,
            quantity: 1,
          },
        ],
        customer_email: params.email,
        success_url: `${appUrl}/payment/success?invoiceId={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/payment/cancelled`,
        metadata: params.metadata,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Recurrente checkout error:', response.status, errorText)
      return {
        success: false,
        error: `Error al crear checkout: ${response.status}`,
      }
    }

    const data = await response.json()

    return {
      success: true,
      data: {
        id: data.id,
        checkout_url: data.checkout_url,
        status: data.status,
      },
    }
  } catch (error) {
    console.error('createCheckout error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

/**
 * Retrieves subscription details from Recurrente.
 *
 * Used to check subscription status, renewal dates, and plan information.
 *
 * @param subscriptionId - The Recurrente subscription ID
 * @returns Result with subscription data or error message
 */
export async function getSubscription(
  subscriptionId: string
): Promise<RecurrenteResult<SubscriptionData>> {
  try {
    validateConfig()

    const response = await fetch(
      `${RECURRENTE_BASE}/subscriptions/${subscriptionId}`,
      {
        method: 'GET',
        headers: createHeaders(),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Recurrente subscription error:', response.status, errorText)

      if (response.status === 404) {
        return {
          success: false,
          error: 'Suscripcion no encontrada',
        }
      }

      return {
        success: false,
        error: `Error al obtener suscripción: ${response.status}`,
      }
    }

    const data = await response.json()

    return {
      success: true,
      data: {
        id: data.id,
        status: data.status,
        customer_email: data.customer_email,
        current_period_start: data.current_period_start,
        current_period_end: data.current_period_end,
        plan: {
          id: data.plan?.id,
          name: data.plan?.name,
          amount: data.plan?.amount,
          currency: data.plan?.currency,
        },
      },
    }
  } catch (error) {
    console.error('getSubscription error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}
