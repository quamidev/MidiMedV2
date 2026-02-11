-- MidiMed v2: Plan Catalog table
-- Created: 2026-02-10
-- Ticket: MV2-002 - Database Schema and Migrations
-- Description: Subscription plans

CREATE TABLE plan_catalog (
  id TEXT PRIMARY KEY,                         -- e.g., "BASIC_GTQ"
  plan TEXT NOT NULL CHECK (plan IN ('TRIAL', 'BASIC', 'PRO', 'ENTERPRISE')),
  currency TEXT NOT NULL CHECK (currency IN ('GTQ', 'USD')),
  price INTEGER NOT NULL,                      -- Centavos
  active BOOLEAN DEFAULT TRUE,

  recurrente_product_id TEXT,
  recurrente_price_id TEXT,
  product_name TEXT,
  product_description TEXT,

  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE plan_catalog IS 'Subscription plans synced from Recurrente';
COMMENT ON COLUMN plan_catalog.id IS 'Composite key like BASIC_GTQ or PRO_USD';
COMMENT ON COLUMN plan_catalog.price IS 'Price in centavos (smallest currency unit)';
COMMENT ON COLUMN plan_catalog.recurrente_product_id IS 'Product ID from Recurrente API';
COMMENT ON COLUMN plan_catalog.recurrente_price_id IS 'Price ID from Recurrente API';
