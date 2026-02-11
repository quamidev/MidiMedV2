-- MidiMed v2: Payment Events table
-- Created: 2026-02-10
-- Ticket: MV2-002 - Database Schema and Migrations
-- Description: Webhook audit log

CREATE TABLE payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,               -- Webhook event ID
  provider TEXT NOT NULL DEFAULT 'recurrente',
  type TEXT NOT NULL,                          -- Event type

  received_at TIMESTAMPTZ DEFAULT NOW(),
  verified BOOLEAN DEFAULT FALSE,

  tenant_id TEXT,
  invoice_id UUID REFERENCES invoices(id),
  link_id TEXT,
  payment_id TEXT,

  payload JSONB NOT NULL                       -- Raw webhook payload
);

-- Indexes
CREATE INDEX idx_payment_events_event_id ON payment_events(event_id);

-- Comments
COMMENT ON TABLE payment_events IS 'Audit log of webhook events from payment provider';
COMMENT ON COLUMN payment_events.event_id IS 'Unique event ID from webhook (for idempotency)';
COMMENT ON COLUMN payment_events.verified IS 'Whether the webhook signature was verified';
COMMENT ON COLUMN payment_events.payload IS 'Raw JSON payload from webhook';
