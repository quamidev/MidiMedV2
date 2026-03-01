# Pricing Model

## Trial Period
- **Duration**: 30 days
- **Access**: Full features
- **No credit card required**

## Plans

| Plan | GTQ/month | USD/month | Target |
|------|-----------|-----------|--------|
| TRIAL | Free | Free | First 30 days |
| BASIC | Q199 | $25 | Solo practitioners |
| PRO | Q399 | $50 | Small clinics (2-5 users) |
| ENTERPRISE | Custom | Custom | Large practices |

## Plan Features

### BASIC
- 1 user
- Unlimited patients
- Appointment calendar
- Medical records
- Email support

### PRO (Recommended)
- Everything in BASIC
- Up to 5 users
- Team collaboration
- Priority support
- AI summaries

### ENTERPRISE
- Everything in PRO
- Unlimited users
- Custom integrations
- Dedicated support
- SLA guarantee

## Payment
- **Provider**: Recurrente
- **Currencies**: GTQ (primary), USD
- **Billing**: Monthly subscription
- **Methods**: Credit card, local payment options

## Billing States
```
TRIAL_ACTIVE → TRIAL_EXPIRED → (purchase) → PAID_ACTIVE
                     ↓
              (no purchase) → locked
```

---

## DOs
- Display GTQ as primary currency
- Show USD option via toggle
- Highlight PRO as recommended
- Emphasize trial (no commitment)

## DON'Ts
- Do NOT gate basic features during trial
- Do NOT auto-charge after trial
- Do NOT hide pricing
