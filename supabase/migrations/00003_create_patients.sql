-- MidiMed v2: Patients table
-- Created: 2026-02-10
-- Ticket: MV2-002 - Database Schema and Migrations
-- Description: Patient demographics

CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  patient_number SERIAL,                       -- Auto-increment per display
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL DEFAULT '',
  birth_date DATE NOT NULL,
  sex TEXT NOT NULL CHECK (sex IN ('M', 'F', 'O')),

  email TEXT,
  phone TEXT,
  address TEXT,

  allergies TEXT,
  notes TEXT,
  photo_url TEXT,

  summary TEXT,                                -- AI-generated patient summary

  created_by UUID NOT NULL REFERENCES users(id),
  latest_appointment_id UUID,                  -- Denormalized for quick access

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_patients_tenant_id ON patients(tenant_id);
CREATE INDEX idx_patients_name ON patients(tenant_id, first_name, last_name);
CREATE INDEX idx_patients_search ON patients USING gin(
  to_tsvector('spanish', coalesce(first_name, '') || ' ' || coalesce(last_name, '') || ' ' || coalesce(email, '') || ' ' || coalesce(phone, ''))
);

-- Comments
COMMENT ON TABLE patients IS 'Patient demographics for a tenant';
COMMENT ON COLUMN patients.patient_number IS 'Auto-increment display number (not PK)';
COMMENT ON COLUMN patients.sex IS 'M=Male, F=Female, O=Other';
COMMENT ON COLUMN patients.summary IS 'AI-generated clinical summary based on medical records';
COMMENT ON COLUMN patients.latest_appointment_id IS 'Denormalized FK for quick access to most recent appointment';
