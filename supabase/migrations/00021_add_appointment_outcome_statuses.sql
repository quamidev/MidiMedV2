-- MidiMed v2: Add appointment outcome statuses
-- Created: 2026-03-02
-- Ticket: AO-001 - Add no_show and rescheduled statuses
-- Description: Extends appointment status to support outcome tracking

-- Drop existing CHECK constraint
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;

-- Add new CHECK constraint with all statuses
ALTER TABLE appointments ADD CONSTRAINT appointments_status_check
  CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show', 'rescheduled'));

-- Update column comment
COMMENT ON COLUMN appointments.status IS 'scheduled: upcoming, completed: finished with record, cancelled: cancelled by user/staff, no_show: patient did not attend, rescheduled: moved to new time (original record)';
