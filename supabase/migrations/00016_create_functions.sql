-- MidiMed v2: Database Functions
-- Created: 2026-02-10
-- Ticket: MV2-004 - Database Functions and Triggers
-- Description: Reusable PL/pgSQL functions for automated operations

-- =============================================================================
-- FUNCTION: update_updated_at()
-- Purpose: Automatically sets updated_at to NOW() on any UPDATE operation
-- Usage: Applied via BEFORE UPDATE triggers on tables with updated_at column
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at() IS 'Sets updated_at to NOW() on row update';

-- =============================================================================
-- FUNCTION: increment_patient_count()
-- Purpose: Increments tenants.total_patients when a new patient is created
-- Usage: Applied via AFTER INSERT trigger on patients table
-- =============================================================================
CREATE OR REPLACE FUNCTION increment_patient_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tenants
  SET total_patients = total_patients + 1
  WHERE tenant_id = NEW.tenant_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION increment_patient_count() IS 'Increments tenant patient counter on patient creation';

-- =============================================================================
-- FUNCTION: increment_appointment_count()
-- Purpose: Increments tenants.total_appointments when a new appointment is created
-- Usage: Applied via AFTER INSERT trigger on appointments table
-- =============================================================================
CREATE OR REPLACE FUNCTION increment_appointment_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tenants
  SET total_appointments = total_appointments + 1
  WHERE tenant_id = NEW.tenant_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION increment_appointment_count() IS 'Increments tenant appointment counter on appointment creation';

-- =============================================================================
-- FUNCTION: increment_record_count()
-- Purpose: Increments tenants.total_records when a new medical record is created
-- Usage: Applied via AFTER INSERT trigger on medical_records table
-- =============================================================================
CREATE OR REPLACE FUNCTION increment_record_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tenants
  SET total_records = total_records + 1
  WHERE tenant_id = NEW.tenant_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION increment_record_count() IS 'Increments tenant medical record counter on record creation';
