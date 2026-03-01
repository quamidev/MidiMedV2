-- MidiMed v2: Add appointment reminder tracking columns
-- Created: 2026-03-01
-- Ticket: PHASE-1-A - Database Migration -- Add Reminder Columns and Reschedule Trigger
-- Description: Adds boolean flags for 24h/2h reminder tracking, a partial index
--              for efficient reminder queries, and a trigger to reset flags on reschedule.

-- =============================================================================
-- COLUMNS: Reminder tracking flags
-- =============================================================================

ALTER TABLE appointments
  ADD COLUMN reminder_24h_sent BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE appointments
  ADD COLUMN reminder_2h_sent BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN appointments.reminder_24h_sent IS 'Whether the 24-hour reminder has been sent for this appointment';
COMMENT ON COLUMN appointments.reminder_2h_sent IS 'Whether the 2-hour reminder has been sent for this appointment';

-- =============================================================================
-- INDEX: Partial index for reminder eligibility queries
-- Only indexes scheduled appointments, keeping the index small and fast.
-- =============================================================================

CREATE INDEX idx_appointments_reminder_eligibility
  ON appointments(status, scheduled_start)
  WHERE status = 'scheduled';

-- =============================================================================
-- FUNCTION: Reset reminder flags when scheduled_start changes
-- Used by the reschedule trigger to ensure reminders are re-sent after
-- an appointment is rescheduled.
-- =============================================================================

CREATE OR REPLACE FUNCTION reset_reminder_flags()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.scheduled_start IS DISTINCT FROM NEW.scheduled_start THEN
    NEW.reminder_24h_sent := FALSE;
    NEW.reminder_2h_sent := FALSE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION reset_reminder_flags() IS 'Resets reminder_24h_sent and reminder_2h_sent to FALSE when scheduled_start changes';

-- =============================================================================
-- TRIGGER: Reset reminder flags on reschedule
-- Fires BEFORE UPDATE so it can modify the NEW row directly.
-- =============================================================================

CREATE TRIGGER reset_reminder_flags_on_reschedule
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION reset_reminder_flags();

COMMENT ON TRIGGER reset_reminder_flags_on_reschedule ON appointments IS 'Resets reminder flags when appointment scheduled_start is changed';
