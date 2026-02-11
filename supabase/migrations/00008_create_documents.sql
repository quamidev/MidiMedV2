-- MidiMed v2: Documents table
-- Created: 2026-02-10
-- Ticket: MV2-002 - Database Schema and Migrations
-- Description: Generated PDFs

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id),
  record_id UUID REFERENCES medical_records(id),

  type TEXT NOT NULL DEFAULT 'appointment_summary_v1',
  storage_path TEXT NOT NULL,
  download_url TEXT NOT NULL,
  size_bytes INTEGER,

  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_documents_tenant_id ON documents(tenant_id);
CREATE INDEX idx_documents_patient_id ON documents(patient_id);

-- Comments
COMMENT ON TABLE documents IS 'Generated PDFs and other documents';
COMMENT ON COLUMN documents.type IS 'Document type, e.g., appointment_summary_v1';
COMMENT ON COLUMN documents.storage_path IS 'Path in Supabase Storage bucket';
COMMENT ON COLUMN documents.download_url IS 'Signed or public download URL';
