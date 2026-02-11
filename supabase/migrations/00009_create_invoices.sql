-- MidiMed v2: Invoices table
-- Created: 2026-02-10
-- Ticket: MV2-002 - Database Schema and Migrations
-- Description: Billing records

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,

  product TEXT NOT NULL CHECK (product IN ('TRIAL', 'BASIC', 'PRO', 'ENTERPRISE')),
  amount INTEGER NOT NULL,                     -- Centavos
  currency TEXT NOT NULL DEFAULT 'GTQ' CHECK (currency IN ('GTQ', 'USD')),

  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),

  provider TEXT NOT NULL DEFAULT 'recurrente',
  provider_link_id TEXT,                       -- Checkout session ID
  provider_link_url TEXT,                      -- Checkout URL
  provider_payment_id TEXT,
  provider_subscription_id TEXT,

  description TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  due_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX idx_invoices_provider_link ON invoices(provider_link_id);

-- Comments
COMMENT ON TABLE invoices IS 'Billing records for subscription payments';
COMMENT ON COLUMN invoices.amount IS 'Amount in centavos (smallest currency unit)';
COMMENT ON COLUMN invoices.provider IS 'Payment provider, default is Recurrente';
COMMENT ON COLUMN invoices.provider_link_id IS 'Checkout session ID from payment provider';
