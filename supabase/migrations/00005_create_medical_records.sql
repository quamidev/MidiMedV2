-- MidiMed v2: Medical Records table
-- Created: 2026-02-10
-- Ticket: MV2-002 - Database Schema and Migrations
-- Description: Clinical documentation

CREATE TABLE medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id),

  summary TEXT NOT NULL,                       -- Brief visit description

  -- Vital signs
  height_cm NUMERIC,
  weight_kg NUMERIC,
  blood_pressure TEXT,                         -- e.g., "120/80"
  temperature_c NUMERIC,
  age_at_visit INTEGER,

  -- Clinical documentation
  diagnosis TEXT,
  prescribed_medications TEXT[],               -- Array of medication strings
  follow_up_instructions TEXT,
  notes TEXT,

  -- Custom fields (organization-specific)
  extras JSONB DEFAULT '{}'::jsonb,

  -- PDF reference
  summary_pdf JSONB,                           -- { doc_id, storage_path, download_url, created_at }

  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK from appointments to medical_records now that both tables exist
ALTER TABLE appointments
  ADD CONSTRAINT fk_appointments_medical_record
  FOREIGN KEY (medical_record_id) REFERENCES medical_records(id);

-- Indexes
CREATE INDEX idx_medical_records_tenant_id ON medical_records(tenant_id);
CREATE INDEX idx_medical_records_patient_id ON medical_records(patient_id, created_at DESC);
CREATE INDEX idx_medical_records_appointment_id ON medical_records(appointment_id);

-- Comments
COMMENT ON TABLE medical_records IS 'Clinical documentation for patient visits';
COMMENT ON COLUMN medical_records.summary IS 'Brief visit description/chief complaint';
COMMENT ON COLUMN medical_records.blood_pressure IS 'Format: systolic/diastolic (e.g., 120/80)';
COMMENT ON COLUMN medical_records.extras IS 'Custom fields defined in tenant.extra_fields';
COMMENT ON COLUMN medical_records.summary_pdf IS 'JSON with doc_id, storage_path, download_url, created_at';
