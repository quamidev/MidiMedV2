-- MidiMed v2: Patient Files table
-- Created: 2026-02-10
-- Ticket: MV2-002 - Database Schema and Migrations
-- Description: Uploaded patient files

CREATE TABLE patient_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

  name TEXT NOT NULL,                          -- Original filename
  storage_path TEXT NOT NULL,
  url TEXT NOT NULL,                           -- Download URL

  uploaded_by UUID NOT NULL REFERENCES users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_patient_files_patient_id ON patient_files(patient_id);

-- Comments
COMMENT ON TABLE patient_files IS 'Uploaded files attached to patients';
COMMENT ON COLUMN patient_files.name IS 'Original filename';
COMMENT ON COLUMN patient_files.storage_path IS 'Path in Supabase Storage bucket';
COMMENT ON COLUMN patient_files.url IS 'Signed or public download URL';
