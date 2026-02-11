-- MidiMed v2: Tenants table
-- Created: 2026-02-10
-- Ticket: MV2-002 - Database Schema and Migrations
-- Description: Organization/clinic data - root of multi-tenancy

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT UNIQUE NOT NULL,              -- URL-safe slug (e.g., "clinica-dental-12345")
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  logo_url TEXT,
  specialties TEXT[] DEFAULT '{}',

  -- Settings (JSONB for flexibility)
  appointment_duration_minutes INTEGER DEFAULT 30,
  working_hours JSONB DEFAULT '{
    "mon": ["08:00", "17:00"],
    "tue": ["08:00", "17:00"],
    "wed": ["08:00", "17:00"],
    "thu": ["08:00", "17:00"],
    "fri": ["08:00", "17:00"],
    "sat": ["08:00", "12:00"],
    "sun": null
  }'::jsonb,
  extra_fields JSONB DEFAULT '[]'::jsonb,      -- Custom medical record field definitions

  -- Counters (maintained via triggers)
  total_patients INTEGER DEFAULT 0,
  total_appointments INTEGER DEFAULT 0,
  total_records INTEGER DEFAULT 0,

  -- Billing
  billing_plan TEXT DEFAULT 'TRIAL' CHECK (billing_plan IN ('TRIAL', 'BASIC', 'PRO', 'ENTERPRISE')),
  billing_status TEXT DEFAULT 'TRIAL_ACTIVE' CHECK (billing_status IN ('TRIAL_ACTIVE', 'TRIAL_EXPIRED', 'PAID_ACTIVE', 'PAST_DUE')),
  trial_start_at TIMESTAMPTZ DEFAULT NOW(),
  trial_days INTEGER DEFAULT 30,
  purchased_at TIMESTAMPTZ,
  paid_through TIMESTAMPTZ,
  provider_subscription_id TEXT,
  wants_to_buy TEXT,

  -- Onboarding
  onboarding_create_patient BOOLEAN DEFAULT FALSE,
  onboarding_create_appointment BOOLEAN DEFAULT FALSE,
  onboarding_view_appointment BOOLEAN DEFAULT FALSE,
  onboarding_complete_appointment BOOLEAN DEFAULT FALSE,
  onboarding_visit_settings BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tenants_tenant_id ON tenants(tenant_id);

-- Comment
COMMENT ON TABLE tenants IS 'Organizations/clinics - root of multi-tenancy model';
COMMENT ON COLUMN tenants.tenant_id IS 'URL-safe slug used for routing and RLS';
COMMENT ON COLUMN tenants.working_hours IS 'JSONB map of weekday to [open, close] hours or null';
COMMENT ON COLUMN tenants.extra_fields IS 'Custom medical record field definitions for this tenant';
