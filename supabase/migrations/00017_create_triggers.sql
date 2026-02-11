-- MidiMed v2: Database Triggers
-- Created: 2026-02-10
-- Ticket: MV2-004 - Database Functions and Triggers
-- Description: Triggers that invoke functions for automated operations

-- =============================================================================
-- TRIGGERS: Auto-update updated_at timestamp
-- Applied to: tenants, patients, appointments, medical_records
-- Timing: BEFORE UPDATE (modifies NEW row before write)
-- =============================================================================

-- Tenants: auto-update updated_at
CREATE TRIGGER set_updated_at_tenants
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

COMMENT ON TRIGGER set_updated_at_tenants ON tenants IS 'Auto-updates updated_at timestamp on row modification';

-- Patients: auto-update updated_at
CREATE TRIGGER set_updated_at_patients
  BEFORE UPDATE ON patients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

COMMENT ON TRIGGER set_updated_at_patients ON patients IS 'Auto-updates updated_at timestamp on row modification';

-- Appointments: auto-update updated_at
CREATE TRIGGER set_updated_at_appointments
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

COMMENT ON TRIGGER set_updated_at_appointments ON appointments IS 'Auto-updates updated_at timestamp on row modification';

-- Medical Records: auto-update updated_at
CREATE TRIGGER set_updated_at_medical_records
  BEFORE UPDATE ON medical_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

COMMENT ON TRIGGER set_updated_at_medical_records ON medical_records IS 'Auto-updates updated_at timestamp on row modification';

-- =============================================================================
-- TRIGGERS: Counter increments for tenant statistics
-- Timing: AFTER INSERT (runs after row is committed)
-- =============================================================================

-- Patients: increment tenant patient count
CREATE TRIGGER on_patient_created
  AFTER INSERT ON patients
  FOR EACH ROW
  EXECUTE FUNCTION increment_patient_count();

COMMENT ON TRIGGER on_patient_created ON patients IS 'Increments tenants.total_patients when a patient is created';

-- Appointments: increment tenant appointment count
CREATE TRIGGER on_appointment_created
  AFTER INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION increment_appointment_count();

COMMENT ON TRIGGER on_appointment_created ON appointments IS 'Increments tenants.total_appointments when an appointment is created';

-- Medical Records: increment tenant record count
CREATE TRIGGER on_record_created
  AFTER INSERT ON medical_records
  FOR EACH ROW
  EXECUTE FUNCTION increment_record_count();

COMMENT ON TRIGGER on_record_created ON medical_records IS 'Increments tenants.total_records when a medical record is created';
