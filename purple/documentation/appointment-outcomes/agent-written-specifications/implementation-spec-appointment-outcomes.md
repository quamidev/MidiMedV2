# Engineering Implementation Spec: Appointment Outcome Management

**GitHub Issue:** #5
**Date:** 2026-03-02
**Status:** Ready for Implementation

---

## 1. Executive Summary

This feature extends the MidiMed appointment model from three statuses (`scheduled`, `completed`, `cancelled`) to five (`scheduled`, `completed`, `cancelled`, `no_show`, `rescheduled`). It adds a No Show confirmation workflow with optional email notification, surfaces no-show data in patient timelines, the dashboard, and the reports page, and makes the existing Reschedule dialog accessible from the appointment popup.

**Key Technical Decisions:**
- The CHECK constraint on the `appointments.status` column is altered via a new migration (`00021`). No new tables are needed.
- The `rescheduled` status is applied to the *original* appointment record when a reschedule occurs. The existing `updateAppointment` action already handles creating the new time slot on the same record -- we keep that pattern and simply add a status transition.
- No-show email is sent directly from a Server Action using the Resend API (same approach as the existing Edge Function email infrastructure), keeping the implementation simple and synchronous for the user.
- All UI text remains in Spanish (Latin American).

**Scope:** 5 phases, 10 tickets.

---

## 2. Technical Architecture

### 2.1 Data Flow

```
Calendar Event Click
        |
        v
  AppointmentPopup
  (appointment-popup.tsx)
        |
        +--- "Completar" ---> existing medical record flow (unchanged)
        |
        +--- "No Show"   ---> NoShowConfirmDialog (NEW)
        |                         |
        |                         +--- markNoShow() server action
        |                         |        |
        |                         |        +--- UPDATE appointments SET status='no_show'
        |                         |        +--- (optional) send email via Resend API
        |                         |        +--- revalidatePath
        |                         |
        |                         +--- toast success/error
        |
        +--- "Reprogramar" --> RescheduleDialog (EXISTING, surfaced via button)
                                  |
                                  +--- rescheduleAppointment() server action (NEW)
                                           |
                                           +--- UPDATE appointments SET status='rescheduled'
                                           +--- INSERT new appointment with status='scheduled'
                                           +--- revalidatePath
```

### 2.2 Database Schema Change

Single migration alters the CHECK constraint on `appointments.status`:

```sql
-- FROM: CHECK (status IN ('scheduled', 'completed', 'cancelled'))
-- TO:   CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show', 'rescheduled'))
```

No new tables. No new columns. The existing `reason` column can optionally store the no-show context.

### 2.3 Status State Machine

```
                   +---> completed
                   |
  scheduled -------+---> cancelled -----> scheduled (reactivate)
                   |
                   +---> no_show -------> scheduled (reactivate)
                   |
                   +---> rescheduled
```

### 2.4 Server Actions (new/modified)

| Action | File | Signature |
|--------|------|-----------|
| `markNoShow` | `src/actions/appointments.ts` | `(input: MarkNoShowInput) => Promise<ActionResult<Appointment>>` |
| `rescheduleAppointment` | `src/actions/appointments.ts` | `(input: RescheduleAppointmentInput) => Promise<ActionResult<RescheduleAppointmentResult>>` |
| `reactivateAppointment` (modified) | `src/actions/appointments.ts` | Accept `no_show` status in addition to `cancelled` |

### 2.5 New Input/Result Types

```typescript
// In src/types/app.ts
interface MarkNoShowInput {
  appointmentId: string
  sendEmail: boolean
}

interface RescheduleAppointmentInput {
  appointmentId: string
  newStart: string
  newEnd: string
}

interface RescheduleAppointmentResult {
  originalAppointment: Appointment
  newAppointment: Appointment
}
```

### 2.6 Email Integration

The no-show notification email follows the same pattern as the existing appointment reminder emails in `supabase/functions/appointment-reminders/_templates/reminder-email.ts`. However, since this email is triggered synchronously by a user action (not a cron job), it will be sent directly from the `markNoShow` server action using the Resend API via `fetch()`. A new email template builder function will live alongside the server action or in a shared `src/lib/email/` directory.

---

## 3. Implementation Phases

### Phase 1: Database and Types

**Objective:** Extend the data model to support the two new appointment statuses.
**Dependencies:** None.
**Success Criteria:** Migration applies cleanly. TypeScript types compile. Existing Zod schemas accept new status values.

### Phase 2: Server Actions

**Objective:** Implement the `markNoShow` and `rescheduleAppointment` server actions, and update `reactivateAppointment` to handle `no_show` status.
**Dependencies:** Phase 1 complete.
**Success Criteria:** All three actions work correctly via manual testing. No-show email sends when opted in.

### Phase 3: UI -- Appointment Popup

**Objective:** Add "No Show" and "Reprogramar" buttons to the appointment popup. Add the No Show confirmation dialog with email notification checkbox.
**Dependencies:** Phase 2 complete.
**Success Criteria:** The three action buttons appear for scheduled appointments. No Show flow works end-to-end. Reschedule button opens the existing reschedule dialog.

### Phase 4: UI -- Patient Profile Timeline

**Objective:** Add status badges for `no_show` and `rescheduled` in the patient appointments component.
**Dependencies:** Phase 1 complete (types only; does not depend on Phase 2/3).
**Success Criteria:** Patient timeline renders correct badges for all five statuses.

### Phase 5: UI -- Dashboard and Reports

**Objective:** Add "No-shows hoy" stat card to the dashboard and "No-shows" KPI card with rate to the reports page.
**Dependencies:** Phase 1 complete (types only; runs in parallel with Phase 3/4).
**Success Criteria:** Dashboard shows today's no-show count. Reports page shows monthly no-show count and rate.

---

## 4. Tickets

### Phase 1: Database and Types

---

#### AO-001: Database Migration -- Extend Appointment Status CHECK Constraint

**Objective:** Add `no_show` and `rescheduled` to the allowed values for the `appointments.status` column.

**Contract/Interface:**
- Migration file: `supabase/migrations/00021_add_appointment_outcome_statuses.sql`
- ALTER the existing CHECK constraint (must DROP old constraint, ADD new one)
- Update the partial index `idx_appointments_reminder_eligibility` to also exclude `no_show` and `rescheduled` from reminder eligibility (only `scheduled` appointments should receive reminders)

**Files:**
- CREATE: `supabase/migrations/00021_add_appointment_outcome_statuses.sql`

**Pattern Reference:**
- `supabase/migrations/00004_create_appointments.sql` -- original CHECK constraint definition
- `supabase/migrations/00019_add_appointment_reminder_columns.sql` -- most recent migration, shows naming/commenting conventions

**Key Considerations:**
- The CHECK constraint name is auto-generated by PostgreSQL. Use `ALTER TABLE appointments DROP CONSTRAINT appointments_status_check;` (PostgreSQL auto-names CHECK constraints as `{table}_{column}_check`).
- Also update the COMMENT on the status column to document all five statuses.
- The overlap check in `createAppointment` and `updateAppointment` currently excludes only `cancelled` via `.neq('status', 'cancelled')`. After this migration, `no_show` and `rescheduled` appointments should also not block time slots. This is addressed in AO-003 but is worth noting.

**Acceptance Criteria:**
- Migration applies successfully against the existing database
- Inserting an appointment with `status = 'no_show'` succeeds
- Inserting an appointment with `status = 'rescheduled'` succeeds
- Inserting an appointment with an invalid status (e.g., `'foo'`) still fails
- The existing partial index on `status = 'scheduled'` continues to work correctly

**Estimated Effort:** S
**Dependencies:** None

---

#### AO-002: Update TypeScript Types and Zod Schemas

**Objective:** Extend the `AppointmentStatus` type and all related Zod schemas to include `no_show` and `rescheduled`.

**Contract/Interface:**
```typescript
// Updated type
type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled'

// New input types
interface MarkNoShowInput {
  appointmentId: string
  sendEmail: boolean
}

interface RescheduleAppointmentInput {
  appointmentId: string
  newStart: string  // ISO 8601
  newEnd: string    // ISO 8601
}

interface RescheduleAppointmentResult {
  originalAppointment: Appointment
  newAppointment: Appointment
}
```

**Files:**
- MODIFY: `src/types/app.ts` -- update `AppointmentStatus` type, add new input/result interfaces
- MODIFY: `src/actions/appointments.ts` -- update the `getAppointmentsSchema` status enum to include new values

**Pattern Reference:**
- `src/types/app.ts` lines 300 (`AppointmentStatus`), 462-478 (`CreateAppointmentInput`, `UpdateAppointmentInput`) -- naming and structure conventions
- `src/actions/appointments.ts` lines 38-46 (`getAppointmentsSchema`) -- Zod enum pattern

**Key Considerations:**
- The `AppointmentStatus` type is used throughout the codebase. Changing it will cause TypeScript errors in files that have exhaustive `Record<AppointmentStatus, ...>` mappings (e.g., `statusConfig` objects). These are addressed in Phase 3-5 tickets.
- The `GetAppointmentsParams.status` field uses `AppointmentStatus` directly, so updating the type propagates filtering support automatically.
- Keep `no_show` with underscore (not `noShow`) to match the database column value convention.

**Acceptance Criteria:**
- `AppointmentStatus` type includes all five values
- `MarkNoShowInput`, `RescheduleAppointmentInput`, and `RescheduleAppointmentResult` types are exported
- `getAppointmentsSchema` Zod enum includes `no_show` and `rescheduled`
- `bun run build` passes without type errors (noting that `statusConfig` objects in UI components will need updating -- those are separate tickets)

**Estimated Effort:** S
**Dependencies:** None (can run in parallel with AO-001)

---

### Phase 2: Server Actions

---

#### AO-003: Implement `markNoShow` Server Action

**Objective:** Create a server action that transitions an appointment from `scheduled` to `no_show` and optionally sends a notification email to the patient.

**Contract/Interface:**
```typescript
export async function markNoShow(input: MarkNoShowInput): Promise<ActionResult<Appointment>>
```

- Validates `appointmentId` is a UUID, `sendEmail` is boolean
- Verifies appointment exists, belongs to tenant, and has status `scheduled`
- Updates status to `no_show`
- If `sendEmail === true` AND patient has an email, sends a no-show notification email via Resend API
- Email failure does NOT revert the status change (fire-and-forget pattern)
- Creates a tenant notification (pattern: `createTenantNotifications`)
- Calls `revalidatePath('/dashboard')` and `revalidatePath(`/patients/${patientId}`)`

**Files:**
- MODIFY: `src/actions/appointments.ts` -- add `markNoShow` action, add `markNoShowSchema` Zod schema
- CREATE: `src/lib/email/no-show-email.ts` -- email template builder function (follows pattern from `supabase/functions/appointment-reminders/_templates/reminder-email.ts`)

**Pattern Reference:**
- `src/actions/appointments.ts` `cancelAppointment` function (lines 663-746) -- nearly identical status transition pattern
- `supabase/functions/appointment-reminders/_templates/reminder-email.ts` -- email HTML builder pattern
- `supabase/functions/appointment-reminders/index.ts` `sendReminder` function (lines 159-206) -- Resend API call pattern

**Key Considerations:**
- The Resend API key must be available as an environment variable (`RESEND_API_KEY`). The server action runs on the Next.js server (not Supabase Edge Functions), so ensure the env var is set in `.env.local`.
- Email send errors should be caught, logged, and result in a secondary toast on the client -- but the action itself should still return `{ success: true }` since the status change succeeded.
- Consider returning a `{ success: true, data: appointment, emailSent: boolean }` shape or keeping it simple and letting the client show a separate toast if needed. The simplest approach: return `ActionResult<Appointment>` and handle email failure logging server-side only.
- The no-show email template should be a brief, neutral message in Spanish. It is NOT a reminder -- it informs the patient that their appointment was recorded as a no-show and encourages them to reschedule. Keep the tone professional, not punitive.
- Add `'appointment_no_show'` as a new notification type string. Update the `NotificationType` union in `src/types/app.ts`.

**Acceptance Criteria:**
- Calling `markNoShow({ appointmentId, sendEmail: false })` changes status to `no_show`
- Calling `markNoShow({ appointmentId, sendEmail: true })` changes status AND sends email (when patient has email)
- Calling `markNoShow` on a non-`scheduled` appointment returns an error
- Email failure does not cause the action to fail
- Tenant notification is created
- Dashboard and patient paths are revalidated

**Estimated Effort:** M
**Dependencies:** AO-001, AO-002

---

#### AO-004: Implement `rescheduleAppointment` Server Action and Update `reactivateAppointment`

**Objective:** Create a server action for explicit reschedule from the popup (marks original as `rescheduled`, creates new `scheduled` appointment), and update `reactivateAppointment` to also accept `no_show` appointments.

**Contract/Interface:**
```typescript
export async function rescheduleAppointment(
  input: RescheduleAppointmentInput
): Promise<ActionResult<RescheduleAppointmentResult>>
```

- Validates input (UUID, ISO date strings)
- Verifies appointment exists, belongs to tenant, status is `scheduled`
- Checks new time slot for overlaps (same pattern as `createAppointment`)
- Updates original appointment: `status = 'rescheduled'`
- Creates new appointment: same `patient_id`, `provider_id`, `reason`, `tenant_id`, `created_by` as original, with new start/end, `status = 'scheduled'`
- Creates a notification
- Calls `revalidatePath`

For `reactivateAppointment`:
- Change the guard from `status !== 'cancelled'` to `status !== 'cancelled' && status !== 'no_show'` (i.e., allow reactivation from both `cancelled` and `no_show`)

**Files:**
- MODIFY: `src/actions/appointments.ts` -- add `rescheduleAppointment`, modify `reactivateAppointment`

**Pattern Reference:**
- `src/actions/appointments.ts` `createAppointment` (lines 354-493) -- overlap checking, notification, appointment creation
- `src/actions/appointments.ts` `reactivateAppointment` (lines 755-857) -- reactivation pattern

**Key Considerations:**
- The existing `updateAppointment` action used by the drag/drop `RescheduleDialog` does NOT set `status = 'rescheduled'` -- it simply moves the same appointment to a new time. This is intentional: drag/drop is a casual time adjustment, not a formal reschedule. The new `rescheduleAppointment` action, triggered from the popup button, creates a formal record of the original appointment being rescheduled and a new separate appointment being created.
- When updating `reactivateAppointment`, change the error message from "Solo se pueden reactivar citas canceladas" to "Solo se pueden reactivar citas canceladas o marcadas como no show".
- The overlap check should exclude `cancelled`, `no_show`, and `rescheduled` statuses (not just `cancelled`). Update the `.neq('status', 'cancelled')` calls throughout the file to use `.in('status', ['scheduled', 'completed'])` or equivalent. This applies to `createAppointment`, `updateAppointment`, and `reactivateAppointment` overlap checks as well.
- Add `'appointment_rescheduled'` to the `NotificationType` union if not already present (check: it is used as a string in `updateAppointment` line 624 but not in the type union).

**Acceptance Criteria:**
- `rescheduleAppointment` marks original as `rescheduled` and creates a new `scheduled` appointment
- New appointment inherits patient, provider, reason from the original
- Overlap validation prevents double-booking
- `reactivateAppointment` works for both `cancelled` and `no_show` appointments
- Overlap checks throughout the file exclude `no_show` and `rescheduled` statuses
- All path revalidation and notifications work correctly

**Estimated Effort:** M
**Dependencies:** AO-001, AO-002

---

### Phase 3: UI -- Appointment Popup

---

#### AO-005: Add No Show and Reschedule Buttons to Appointment Popup

**Objective:** Add "No Show" and "Reprogramar" action buttons to the appointment popup for scheduled appointments. Wire "Reprogramar" to open the existing RescheduleDialog.

**Contract/Interface:**
- New props on `AppointmentPopup`: `onReschedule?: (appointment: AppointmentWithRelations) => void`
- New buttons in the `scheduled` status section of `PopupContent`
- Import and wire the `RescheduleDialog` (or delegate reschedule to parent via `onReschedule` callback)

**Files:**
- MODIFY: `src/components/appointments/appointment-popup.tsx` -- add buttons, add `no_show` status to `statusConfig`, add No Show confirmation dialog
- The parent component (calendar page) may need wiring to pass `onReschedule` prop -- check how `onComplete` is currently passed

**Pattern Reference:**
- `src/components/appointments/appointment-popup.tsx` lines 301-373 -- existing action buttons section (the pattern for `scheduled`, `completed`, `cancelled` button groups)
- `src/components/appointments/appointment-popup.tsx` lines 505-543 -- cancel confirmation AlertDialog pattern (replicate for No Show)
- `src/components/appointments/reschedule-dialog.tsx` -- the dialog to open when "Reprogramar" is clicked

**Key Considerations:**
- The "No Show" button should use amber/warning styling (not red/destructive like Cancel). Use `text-amber-600 hover:bg-amber-500/10` pattern.
- The "Reprogramar" button should use a neutral/outline style.
- Button order for scheduled appointments should be: "Editar" (outline), "No Show" (amber outline), "Cancelar" (destructive outline), then "Completar" (primary, full width) -- keeping Completar as the most prominent action.
- The "Reprogramar" button opens the existing `RescheduleDialog` but calls the NEW `rescheduleAppointment` action instead of `updateAppointment`. This means the `RescheduleDialog` needs to either accept a custom `onConfirm` handler or the popup needs to manage the reschedule dialog state internally.
- Architectural decision: It is simpler to have the popup emit an `onReschedule` callback to the parent, and let the parent manage the `RescheduleDialog`. This keeps the popup focused on display + simple actions.
- Add `no_show` and `rescheduled` entries to the `statusConfig` record in `appointment-popup.tsx`.
- For `no_show` status, show "Reactivar Cita" button (same as `cancelled`).

**Acceptance Criteria:**
- Scheduled appointments show "No Show" and "Reprogramar" buttons
- "No Show" button opens a confirmation dialog (AO-006)
- "Reprogramar" button triggers the reschedule flow
- `no_show` status shows amber badge and "Reactivar Cita" button
- `rescheduled` status shows a distinct badge (no action buttons needed)
- No regressions in existing button behaviors (Edit, Cancel, Complete, Reactivate)

**Estimated Effort:** M
**Dependencies:** AO-003, AO-004

---

#### AO-006: Create No Show Confirmation Dialog

**Objective:** Build the confirmation dialog shown when a user clicks "No Show" on an appointment, with optional email notification checkbox.

**Contract/Interface:**
```typescript
interface NoShowConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment: AppointmentWithRelations
  patientEmail: string | null   // null = no email on file
  onConfirm: (sendEmail: boolean) => Promise<void>
  isLoading: boolean
}
```

**Files:**
- CREATE or inline within: `src/components/appointments/no-show-confirm-dialog.tsx`
  - Alternatively, inline it within `appointment-popup.tsx` alongside the existing cancel dialog. Both patterns are acceptable; a separate file is cleaner given the email checkbox logic.

**Pattern Reference:**
- `src/components/appointments/appointment-popup.tsx` lines 505-543 -- cancel confirmation `AlertDialog` (same structure: icon, title, description, footer buttons)
- `src/components/ui/alert-dialog.tsx` -- shadcn AlertDialog primitives
- `src/components/ui/checkbox.tsx` -- shadcn Checkbox for the email opt-in

**Key Considerations:**
- The dialog needs access to the patient's email to determine checkbox state. The current `AppointmentWithRelations` type does NOT include patient email. Two options:
  1. Add `patient_email: string | null` to `AppointmentWithRelations` (requires updating the join in `getAppointments` and `getAppointmentById`).
  2. Fetch patient email separately when the dialog opens.
  - Option 1 is better for consistency. Add `patient_email` to the `AppointmentWithRelations` interface and update the two query functions to include `email` in the patient join.
- The checkbox should be `disabled` (not hidden) when `patientEmail` is null. Show helper text: "El paciente no tiene correo registrado."
- The confirm button should use amber/warning styling: `className="bg-amber-500 text-white hover:bg-amber-600"`.
- The dialog calls the `markNoShow` server action from AO-003. Wire loading/error states.
- Warning icon: use `AlertTriangle` from lucide-react with amber coloring.

**Acceptance Criteria:**
- Dialog shows patient name and appointment time in the confirmation message
- Email checkbox is unchecked by default
- Email checkbox is disabled with helper text when patient has no email
- "Cancelar" closes the dialog without action
- "Confirmar No Show" calls `markNoShow` and shows appropriate toast
- Loading state disables both buttons during the action

**Estimated Effort:** M
**Dependencies:** AO-003, AO-005

---

### Phase 4: UI -- Patient Profile Timeline

---

#### AO-007: Add Status Badges for `no_show` and `rescheduled` in Patient Appointments

**Objective:** Update the patient appointments timeline component to display distinct visual badges for the two new appointment statuses.

**Contract/Interface:**
- Extend the `statusConfig` Record in `patient-appointments.tsx` with two new entries:
  - `no_show`: `{ label: 'No Show', icon: UserX, className: amber, bgClassName: amber }`
  - `rescheduled`: `{ label: 'Reprogramada', icon: CalendarClock or RefreshCw, className: slate/blue, bgClassName: slate/blue }`
- Update the local `AppointmentStatus` type alias (line 33) to include the new values, or import from `@/types/app`

**Files:**
- MODIFY: `src/components/patients/patient-appointments.tsx`

**Pattern Reference:**
- `src/components/patients/patient-appointments.tsx` lines 35-62 -- existing `statusConfig` record with `scheduled`, `completed`, `cancelled` entries
- `src/components/appointments/appointment-popup.tsx` lines 93-115 -- similar status config pattern in the popup

**Key Considerations:**
- The component currently defines a local `AppointmentStatus` type alias (line 33) that duplicates the one in `@/types/app.ts`. After AO-002 updates the canonical type, this local alias should be removed and the import used instead.
- For icon choices: `UserX` (from lucide-react) for no-show, and `CalendarClock` or `RefreshCw` for rescheduled. Both are already available in the lucide-react package.
- Amber color palette for no-show: `text-amber-600 dark:text-amber-400` and `bg-amber-100 dark:bg-amber-500/20`.
- Slate/blue palette for rescheduled: `text-slate-600 dark:text-slate-400` and `bg-slate-100 dark:bg-slate-500/20`.
- The `upcoming` vs `past` sorting logic in the `useMemo` (line 151) currently puts `scheduled` non-past appointments into `upcoming`. No change needed: `no_show` and `rescheduled` appointments are not `scheduled`, so they correctly go to `past`.

**Acceptance Criteria:**
- `no_show` appointments display with an amber badge, "No Show" label, and `UserX` icon
- `rescheduled` appointments display with a slate/blue badge, "Reprogramada" label, and appropriate icon
- No TypeScript errors when rendering appointments with any of the five statuses
- Existing badge styles for `scheduled`, `completed`, `cancelled` are unchanged

**Estimated Effort:** S
**Dependencies:** AO-002

---

### Phase 5: UI -- Dashboard and Reports

---

#### AO-008: Add "No-shows hoy" Stat Card to Dashboard

**Objective:** Add a fourth quick stat card to the dashboard showing today's no-show appointment count.

**Contract/Interface:**
- New stat entry in the `stats` array within the `QuickStats` component
- New state variable: `noShowCount`
- New query: `getAppointments({ startDate: today, endDate: today, status: 'no_show' })`
  - NOTE: The current `getAppointments` does not filter by status on the client side -- it has a `status` filter parameter. After AO-002, this supports `'no_show'`.
  - Actually, check: the `getAppointments` server action does accept a `status` parameter. After AO-002 updates the Zod schema, passing `status: 'no_show'` will work. However, the current dashboard `QuickStats` does NOT use the `status` filter -- it fetches all appointments and uses the total count. For the no-show card, use `status: 'no_show'` to get only no-shows. Alternatively, filter client-side from the already-fetched today's appointments. The latter is more efficient (one fewer API call).

**Files:**
- MODIFY: `src/app/(protected)/dashboard/page.tsx` -- update `QuickStats` component

**Pattern Reference:**
- `src/app/(protected)/dashboard/page.tsx` lines 79-186 -- existing `QuickStats` component with three stat cards

**Key Considerations:**
- The most efficient approach: reuse the `todayAppointments` fetch that already runs and filter for `status === 'no_show'` client-side. This avoids an extra server action call.
- Store the today's appointments result and derive `todayCount` (total) and `noShowCount` (filtered) from the same data.
- Color: `text-amber-500` and `bg-amber-500/10` -- however, the "Esta semana" card already uses amber. Consider using `text-orange-500` and `bg-orange-500/10` for the no-show card to differentiate, or keep amber and change the "Esta semana" card to a different color (e.g., `text-blue-500`).
- Icon: `UserX` from lucide-react.
- The grid changes from `sm:grid-cols-3` to `sm:grid-cols-2 lg:grid-cols-4` to accommodate four cards responsively.
- Mobile: The `DashboardHeader` on mobile also shows appointment count. The no-show count could optionally be surfaced there, but it is not required by the spec. Keep it simple: desktop only for now (the stat cards are only rendered in the desktop view section).

**Acceptance Criteria:**
- A fourth stat card labeled "No-shows hoy" appears in the desktop Quick Stats section
- The card shows the correct count of today's `no_show` appointments (0 when none)
- The card uses amber/orange color with the `UserX` icon
- The responsive grid accommodates four cards cleanly on all screen sizes
- Loading skeleton accounts for the fourth card

**Estimated Effort:** S
**Dependencies:** AO-002

---

#### AO-009: Add No-Show KPI Card and Rate to Reports Page

**Objective:** Add a "No-shows" KPI card showing the monthly count, and display the no-show rate percentage.

**Contract/Interface:**
- New stat in the `stats` state object: `noShowAppointments: number`
- Derived value: `noShowRate = totalAppointments > 0 ? Math.round((noShowAppointments / totalAppointments) * 100) : 0`
- New `KpiCard` in the grid

**Files:**
- MODIFY: `src/app/(protected)/reports/page.tsx` -- update `fetchData`, `stats` state, and KPI card grid

**Pattern Reference:**
- `src/app/(protected)/reports/page.tsx` lines 113-293 -- existing reports page with four KPI cards and data fetching pattern
- `src/app/(protected)/reports/page.tsx` lines 48-107 -- `KpiCard` component (reuse directly)

**Key Considerations:**
- The no-show count is derived from the same `getAppointments` call that already fetches all monthly appointments. Add `.filter(a => a.status === 'no_show').length` alongside the existing `completed` and `cancelled` filters.
- The no-show rate should be displayed as a secondary metric. Options:
  1. Show it as a `trend` on the No-show KPI card (but `trend` is a percentage change, not a rate).
  2. Show it as a subtitle/description below the count in the card.
  3. Show it as a separate card.
  - Best approach: display the rate as formatted text below the count within the same KPI card. This requires a minor enhancement to the `KpiCard` component to accept an optional `subtitle` prop.
- The KPI grid changes from `lg:grid-cols-4` to `lg:grid-cols-5` or wraps. Given five cards, `sm:grid-cols-2 lg:grid-cols-5` may be tight. Consider `sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5` or keep `lg:grid-cols-4` and let the fifth card wrap.
- Icon: `UserX` from lucide-react. Color: `text-amber-500` / `bg-amber-500/10`.
- The PDF export captures the `#reports-content` div, so adding new cards within that div will automatically include them in the export.

**Acceptance Criteria:**
- A "No-shows" KPI card appears alongside existing KPI cards
- The card shows the count of `no_show` appointments for the current month
- The no-show rate percentage is displayed (either in the card or alongside it)
- When there are no appointments, the rate shows "0%"
- The new card is included in PDF export automatically
- Loading skeleton accounts for the fifth card

**Estimated Effort:** S
**Dependencies:** AO-002

---

#### AO-010: Add `patient_email` to `AppointmentWithRelations`

**Objective:** Include the patient's email address in the `AppointmentWithRelations` type and update the query joins so the No Show dialog can determine whether to enable the email checkbox.

**Contract/Interface:**
```typescript
// Updated interface
interface AppointmentWithRelations extends Appointment {
  // ... existing fields
  patient_email: string | null   // NEW
}
```

**Files:**
- MODIFY: `src/types/app.ts` -- add `patient_email` to `AppointmentWithRelations`
- MODIFY: `src/actions/appointments.ts` -- update `getAppointments` and `getAppointmentById` patient joins to include `email`, and map it to the return object

**Pattern Reference:**
- `src/actions/appointments.ts` lines 188-189 -- current patient join: `patients!inner(first_name, last_name)` -- add `email` to this select
- `src/actions/appointments.ts` lines 228-253 -- mapping function that constructs `AppointmentWithRelations` -- add `patient_email` field

**Key Considerations:**
- This is a minimal change. The patient join already exists; we simply add `email` to the selected columns.
- The `patient_email` field is `string | null` since patients may not have an email on file.
- This data is used by the No Show confirmation dialog (AO-006) to determine checkbox enabled state.

**Acceptance Criteria:**
- `AppointmentWithRelations` includes `patient_email: string | null`
- `getAppointments` returns `patient_email` for each appointment
- `getAppointmentById` returns `patient_email`
- No regression in existing appointment queries

**Estimated Effort:** S
**Dependencies:** None (can run in parallel with AO-002)

---

## 5. Cross-Cutting Concerns

### Error Handling
- All server actions return `ActionResult<T>` with Spanish error messages
- Email send failures are logged server-side but do NOT cause the status update to fail
- Network errors show toast messages and keep dialogs/popups open for retry
- Pattern: follow `cancelAppointment` error handling exactly

### Loading States
- All action buttons show loading state during server action calls (use `isLoading` prop on Button)
- The No Show confirmation dialog disables both buttons during loading
- Dashboard and Reports show skeleton cards during data fetch

### Accessibility
- All new dialogs use shadcn `AlertDialog` / `Dialog` which handle focus management and keyboard navigation
- Status badges use color + text label + icon (not color alone)
- The email checkbox has an associated label and disabled state tooltip

### Performance
- No new database indexes needed (the existing `idx_appointments_status` on `(tenant_id, status)` already supports status filtering)
- Dashboard no-show count derived from existing query (no extra API call)
- Reports no-show count derived from existing query (no extra API call)

### Security
- All server actions verify authentication and tenant_id before mutations
- RLS policies on the `appointments` table enforce tenant isolation
- The Resend API key is stored as a server-side environment variable only
- No patient email addresses are exposed to the client beyond what is already in the appointment context

---

## 6. Testing Strategy

Per the project testing standard, there is no automated test framework configured. Testing is manual.

**Manual Testing Checklist:**
1. `bun run build` passes after each phase
2. `bun run lint` passes after each phase
3. Create a scheduled appointment, mark it as No Show (with and without email), verify status changes across all UI surfaces
4. Create a scheduled appointment, reschedule it, verify original shows "Reprogramada" and new appointment appears
5. Reactivate a no-show appointment, verify it returns to scheduled
6. Verify dashboard "No-shows hoy" card shows correct count
7. Verify reports "No-shows" KPI shows correct count and rate
8. Verify patient profile timeline shows correct badges for all statuses
9. Test on Chrome and Safari, desktop and mobile (768px breakpoint)
10. Verify PDF export includes new no-show metrics

---

## 7. Deployment Plan

### Environment Variables
- `RESEND_API_KEY` -- already set for appointment reminders. Verify it is available in the Next.js server environment (not just Supabase Edge Functions).

### Database Migrations
- Apply `00021_add_appointment_outcome_statuses.sql` before deploying the new code
- Migration is backward-compatible: existing data with `scheduled`, `completed`, `cancelled` is unaffected

### Feature Flags
- None required. The new statuses are only reachable via explicit user actions.

### Rollout Strategy
- Deploy migration first
- Deploy code changes
- Verify in staging (local development) before production
- No data backfill needed -- only new actions create `no_show` and `rescheduled` records

---

## 8. Risks and Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| CHECK constraint name is not `appointments_status_check` | Migration fails | Query `pg_constraint` to find the actual name before writing the migration. Use `ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;` as a safety measure. |
| Resend API key not available in Next.js server environment | No-show emails fail silently | Verify env var is set. The email is optional -- action succeeds regardless. Add a console.error log when the key is missing. |
| Overlap check changes (excluding `no_show`/`rescheduled`) affect existing appointment creation | Unexpected double-bookings | The overlap check is being relaxed correctly: `no_show` and `rescheduled` slots should be available. Test thoroughly with overlapping scenarios. |
| `statusConfig` exhaustiveness breaks after type change | TypeScript build errors | AO-005 and AO-007 address this. Ensure these tickets run before `bun run build` is required to pass. Phase 1 may produce temporary build errors that Phase 3-5 resolve. |
| RescheduleDialog currently tightly coupled to drag/drop flow | Reschedule from popup may need different behavior | The new `rescheduleAppointment` action is separate from `updateAppointment`. The popup reschedule flow should use the new action. May need a modified version of `RescheduleDialog` or a wrapper. |

---

## Dependency Graph

```
AO-001 (DB Migration) ──┐
                         ├──> AO-003 (markNoShow) ──┐
AO-002 (Types/Schemas) ─┤                           ├──> AO-005 (Popup Buttons)
                         ├──> AO-004 (reschedule +   │         │
                         │    reactivate)  ──────────┘         │
                         │                                     v
                         ├──> AO-007 (Patient Timeline)  AO-006 (NoShow Dialog)
                         │
                         ├──> AO-008 (Dashboard Stat)
                         │
                         └──> AO-009 (Reports KPI)

AO-010 (patient_email) ──> AO-006 (NoShow Dialog needs email)
```

**Parallelization opportunities:**
- AO-001 and AO-002 run in parallel (Phase 1)
- AO-003 and AO-004 can run in parallel (Phase 2) once Phase 1 is complete
- AO-007, AO-008, AO-009 can all run in parallel with each other and with Phase 3, once AO-002 is complete
- AO-010 can run in parallel with AO-001/AO-002 (Phase 1)
