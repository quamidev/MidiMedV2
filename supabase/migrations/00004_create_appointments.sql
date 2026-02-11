-- MidiMed v2: Appointments table
-- Created: 2026-02-10
-- Ticket: MV2-002 - Database Schema and Migrations
-- Description: Scheduled visits

CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES users(id),

  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,

  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  reason TEXT,                                 -- Notes/reason for visit

  medical_record_id UUID,                      -- Set when completed (FK added after medical_records table)

  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_appointments_tenant_id ON appointments(tenant_id);
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_provider_id ON appointments(provider_id);
CREATE INDEX idx_appointments_schedule ON appointments(tenant_id, scheduled_start);
CREATE INDEX idx_appointments_status ON appointments(tenant_id, status);

-- Comments
COMMENT ON TABLE appointments IS 'Scheduled patient visits';
COMMENT ON COLUMN appointments.status IS 'scheduled: upcoming, completed: finished with record, cancelled: cancelled';
COMMENT ON COLUMN appointments.medical_record_id IS 'FK to medical_records, set when appointment is completed';
COMMENT ON COLUMN appointments.reason IS 'Brief reason or notes for the visit';
