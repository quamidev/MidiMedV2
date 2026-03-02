# AO-003 & AO-004: Server Actions Implementation

## What Was Implemented

### AO-003: markNoShow Server Action
Added a new `markNoShow` server action to `src/actions/appointments.ts` that transitions an appointment from `scheduled` to `no_show` status. The action validates input via a Zod schema (`markNoShowSchema`), verifies the appointment exists and belongs to the tenant, updates the status, optionally sends a notification email to the patient via the Resend API (when `sendEmail` is true and the patient has an email address on file), and creates a tenant-wide notification. A new email template module was created at `src/lib/email/no-show-email.ts` providing both HTML and plain-text builders for the no-show notification email, styled consistently with Spanish-language content for the Guatemalan market.

### AO-004: rescheduleAppointment, reactivateAppointment Updates, and Overlap Check Improvements
- **Part A**: Added `rescheduleAppointment` server action that marks the original appointment as `rescheduled` and creates a brand-new `scheduled` appointment with the same patient, provider, and reason but at the new requested time. Includes rollback logic if the new appointment insert fails. Returns both the original and new appointment.
- **Part B**: Updated `reactivateAppointment` to accept both `cancelled` and `no_show` statuses (previously only accepted `cancelled`).
- **Part C**: Updated overlap checks in `createAppointment`, `updateAppointment`, and `reactivateAppointment` to exclude `no_show` and `rescheduled` appointments (previously only excluded `cancelled`), ensuring freed time slots can be reused.

## Key Technical Decisions
- Email sending uses dynamic `import()` for the template module to keep it tree-shakeable when email is not needed.
- Email failures are caught and logged but do not block the status update, following the same non-blocking pattern used elsewhere in the codebase.
- The `rescheduleAppointment` action includes rollback logic: if creating the new appointment fails after the original was marked as `rescheduled`, the original is reverted back to `scheduled`.
- Overlap checks use `.not('status', 'in', '("cancelled","no_show","rescheduled")')` syntax to exclude all terminal/inactive statuses in a single filter.

## Files Created or Modified
- **Created**: `src/lib/email/no-show-email.ts` -- No-show email HTML and text template builders
- **Modified**: `src/actions/appointments.ts` -- Added `markNoShow` and `rescheduleAppointment` actions, updated `reactivateAppointment` status check, updated overlap queries, added new Zod schemas and type imports

## Testing Performed
- TypeScript compilation passes with no errors in modified files (`tsc --noEmit`)
- ESLint passes on all modified files
- Build failure is pre-existing (unrelated `playwright` missing module in `purple/documentation/ai-dictation/qa-test.ts`)

## Deviations from Spec
None. Implementation follows the ticket specification precisely.

## Known Limitations
- The `rescheduleAppointment` action does not send an email notification to the patient (only creates an in-app tenant notification). Email notification for rescheduling could be a future enhancement.
- The `markNoShow` email uses `toLocaleDateString`/`toLocaleTimeString` with `es-GT` locale, which depends on the server's ICU data being available.
