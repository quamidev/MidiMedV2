# PHASE-1-A: Database Migration -- Add Reminder Columns and Reschedule Trigger

## What was implemented

Added appointment reminder tracking infrastructure to the database layer. The migration adds two boolean columns (`reminder_24h_sent`, `reminder_2h_sent`) to the `appointments` table for tracking whether reminders have been dispatched, a partial index for efficiently querying reminder-eligible appointments, and a trigger function that automatically resets both flags when an appointment is rescheduled (i.e., when `scheduled_start` changes). The TypeScript `Appointment` interface and the server action appointment mappings were updated to include the new fields.

## Key technical decisions

- Used `IS DISTINCT FROM` in the trigger function instead of `!=` to correctly handle potential `NULL` comparisons on `scheduled_start`, providing safer null-aware comparison semantics.
- Used `CREATE OR REPLACE FUNCTION` for the trigger function to allow safe re-application of the migration.
- The partial index filters on `WHERE status = 'scheduled'` to keep the index small -- only scheduled appointments need reminder processing, so completed and cancelled rows are excluded.
- Used `?? false` as a nullish coalescing fallback in the TypeScript appointment mappings to provide defensive defaults for the new boolean fields during the transition period before the migration is applied.

## Files created or modified

- `supabase/migrations/00019_add_appointment_reminder_columns.sql` -- New migration adding columns, partial index, trigger function, and trigger.
- `src/types/app.ts` -- Added `reminder_24h_sent` and `reminder_2h_sent` boolean fields to the `Appointment` interface. Updated changelog header.
- `src/actions/appointments.ts` -- Added `reminder_24h_sent` and `reminder_2h_sent` to the manual field mappings in `getAppointments` and `getAppointmentById` functions. Updated changelog header.

## Testing performed

- `npx tsc --noEmit` -- passes with zero errors (excluding pre-existing `qa-test.ts` playwright import issue unrelated to this ticket).
- `npm run build` -- compiled successfully; the only failure is the pre-existing `playwright` import in `purple/documentation/ai-dictation/qa-test.ts`, which is unrelated to these changes.
- Verified the SQL migration syntax is valid PostgreSQL and follows existing project patterns from `00004_create_appointments.sql` and `00017_create_triggers.sql`.

## Known limitations

- The migration has not been run against a live Supabase instance yet. It should be applied via `supabase db push` or the Supabase dashboard migration runner before the reminder cron job (Phase 2) is deployed.
- The pre-existing build failure from `purple/documentation/ai-dictation/qa-test.ts` (missing `playwright` dependency) prevents a fully clean `npm run build`. This is not caused by this ticket's changes.
