# Payments Standard

## Provider
Recurrente (Latin American payment gateway)

## Supported Currencies
- GTQ (Guatemalan Quetzal) - Primary
- USD (US Dollar) - Secondary

## Architecture

```
┌─────────────────────────────────────────────────────┐
│              Pricing Page / Checkout Modal          │
└───────────────────────┬─────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────┐
│         createCheckoutSession() Server Action       │
│   1. Create invoice record (status: pending)        │
│   2. Call Recurrente API                            │
│   3. Return checkout URL                            │
└───────────────────────┬─────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────┐
│              Recurrente Hosted Checkout             │
└───────────────────────┬─────────────────────────────┘
                        │ Webhook callback
┌───────────────────────▼─────────────────────────────┐
│        /api/webhooks/recurrente/route.ts            │
│   1. Verify webhook signature                       │
│   2. Update invoice status                          │
│   3. Update tenant billing_plan/status              │
└─────────────────────────────────────────────────────┘
```

## Key Files
- `src/lib/recurrente/client.ts` - API client
- `src/actions/billing.ts` - Billing actions
- `src/app/api/webhooks/recurrente/route.ts` - Webhook handler

## Plan Types
```typescript
type BillingPlan = 'TRIAL' | 'BASIC' | 'PRO' | 'ENTERPRISE'
type BillingStatus = 'TRIAL_ACTIVE' | 'TRIAL_EXPIRED' | 'PAID_ACTIVE' | 'PAST_DUE'
```

---

## DOs
- Store plan catalog in `plan_catalog` table
- Create invoice record before checkout
- Verify webhook signatures
- Handle all payment statuses

## DON'Ts
- Do NOT expose Recurrente secret key
- Do NOT process payments without invoice
- Do NOT skip webhook verification
- Do NOT store card details locally
