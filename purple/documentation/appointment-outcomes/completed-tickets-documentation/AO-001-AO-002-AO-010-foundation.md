# AO-001, AO-002, AO-010 -- Foundation Implementation

**Date:** 2026-03-02
**Tickets:** AO-001, AO-002, AO-010

## What Was Implemented

These three tickets establish the foundation for the Appointment Outcomes feature by extending the database schema, TypeScript type system, and data access layer.

### AO-001: Database Migration
- Created `supabase/migrations/00021_add_appointment_outcome_statuses.sql`
- Drops the existing `appointments_status_check` constraint
- Adds a new CHECK constraint supporting five statuses: `scheduled`, `completed`, `cancelled`, `no_show`, `rescheduled`
- Updates the column comment to document all status meanings

### AO-002: TypeScript Types and Zod Schemas
- Updated `AppointmentStatus` type in `src/types/app.ts` to include `no_show` and `rescheduled`
- Added three new interfaces: `MarkNoShowInput`, `RescheduleAppointmentInput`, `RescheduleAppointmentResult`
- Added `appointment_no_show` and `appointment_rescheduled` to the `NotificationType` union
- Updated the Zod enum in `src/actions/appointments.ts` (`getAppointmentsSchema.status`) to accept all five statuses

### AO-010: Patient Email in AppointmentWithRelations
- Added `patient_email: string | null` to the `AppointmentWithRelations` interface
- Updated `getAppointments` query to join `email` from the `patients` table
- Updated `getAppointmentById` query to join `email` from the `patients` table
- Both mapping blocks now include `patient_email` in the returned object
- Updated patient type annotations in both functions to include `email`

## Files Created
- `supabase/migrations/00021_add_appointment_outcome_statuses.sql`

## Files Modified
- `src/types/app.ts` -- new types, extended unions, new interface field
- `src/actions/appointments.ts` -- Zod schema update, patient email joins and mappings

## Testing
- `npm run build` compiles successfully (Turbopack reports "Compiled successfully"). The only build failure is a pre-existing `playwright` module issue in `purple/documentation/ai-dictation/qa-test.ts`, which is unrelated to this work.

## Notes for Subsequent Tickets
- The new `MarkNoShowInput`, `RescheduleAppointmentInput`, and `RescheduleAppointmentResult` types are ready for use by the server action tickets (AO-003, AO-004).
- The `patient_email` field is now available on all `AppointmentWithRelations` objects, enabling the no-show email checkbox in the UI (AO-006).
- UI components that display appointment statuses will need status config entries for `no_show` and `rescheduled` (label, color, icon) -- this is expected and will be handled by subsequent tickets.
