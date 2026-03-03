# Product Specification: Appointment Outcome Management

**GitHub Issue:** #5
**Repository:** quamidev/MidiMedV2
**Date:** 2026-03-02
**Status:** Ready for Engineering Architect

---

## Overall Product Goal

Allow doctors and staff to record the outcome of every appointment -- Completed, No-Show, or Rescheduled -- directly from the calendar or appointment detail view. Surface no-show data prominently in patient history, the dashboard, and the reports page so clinics can identify patterns, reduce missed appointments, and keep accurate operational records.

### Problem Being Solved

Today, MidiMed appointments can only be marked as `scheduled`, `completed`, or `cancelled`. There is no way to distinguish a patient who did not show up from one whose appointment was cancelled in advance. This gap means:

1. Clinics cannot track patient reliability or identify chronic no-shows.
2. Doctors have no quick post-appointment workflow -- "Complete" exists, but "No-Show" and "Reschedule" are missing or hard to find.
3. Reports lack no-show metrics, which are critical for understanding clinic utilization and lost revenue.

### Target Users

- **Dr. Maria (Admin/Provider)** -- Marks appointment outcomes after each time slot. Needs a fast, one-click workflow from the calendar.
- **Sofia (Staff)** -- Manages the front desk. Marks no-shows when patients fail to arrive. May send a follow-up email.

### Expected User Value

- Faster end-of-appointment workflow (one click to complete or mark no-show).
- Accurate patient attendance records visible in patient profiles.
- Actionable no-show metrics in dashboard and reports, enabling data-driven scheduling decisions.
- Optional patient notification on no-show to encourage re-engagement.

---

## Overall Acceptance Criteria

1. The appointment status model supports five states: `scheduled`, `completed`, `no_show`, `cancelled`, `rescheduled`.
2. When viewing a `scheduled` appointment (popup or detail), the doctor sees three prominent action buttons: **Completar**, **No Show**, and **Reprogramar**.
3. Marking an appointment as "Completar" opens the medical record form (existing behavior, unchanged).
4. Marking an appointment as "No Show" sets the status to `no_show`, logs the event in patient history, and optionally sends a notification email to the patient.
5. Marking an appointment as "Reprogramar" opens the existing reschedule dialog (surfaced more prominently than before).
6. The patient profile appointment timeline displays `no_show` entries with a distinct visual indicator (e.g., orange/amber badge with a clear "No Show" label).
7. The dashboard shows a "No-shows hoy" count alongside existing quick stats.
8. The reports page shows a "No-shows" KPI card with count and rate for the current month.
9. The reports page offers a no-show breakdown by time period (weekly or monthly view).
10. All UI text is in Spanish (Latin American), consistent with the existing application language.

---

## User Flows

### Flow 1: Mark Appointment as Completed

**Trigger:** Doctor clicks on a `scheduled` appointment in the calendar or appointment popup.

1. User clicks the appointment event on the calendar (or taps on mobile).
2. System displays the appointment popup/dialog showing patient name, provider, date/time, and status badge ("Programada").
3. User sees three action buttons: **Completar**, **No Show**, **Reprogramar**.
4. User clicks **Completar**.
5. System closes the popup and opens the medical record creation form for that appointment (existing behavior).
6. Upon saving the medical record, the appointment status transitions to `completed`.

**Edge Cases:**
- If the appointment is in the past (time has already passed), the same flow applies -- no restriction on when completion can be marked.
- If the appointment already has a medical record linked, the "Completar" button is not shown (same as current behavior for `completed` appointments).

**Error States:**
- Network failure during status update: System shows a toast error ("Error al completar la cita") and keeps the popup open so the user can retry.

---

### Flow 2: Mark Appointment as No-Show

**Trigger:** Doctor or staff clicks on a `scheduled` appointment and selects "No Show."

1. User clicks the appointment event on the calendar.
2. System displays the appointment popup with action buttons.
3. User clicks **No Show**.
4. System displays a confirmation dialog:
   - Header: Warning icon with "Marcar como No Show"
   - Body: "Confirma que [Patient Name] no se presento a la cita programada para [Date] a las [Time]?"
   - Checkbox (unchecked by default): "Enviar notificacion por correo al paciente"
   - Buttons: "Cancelar" (secondary) and "Confirmar No Show" (primary, amber/warning style)
5. User optionally checks the email notification checkbox.
6. User clicks **Confirmar No Show**.
7. System updates the appointment status to `no_show`.
8. System shows a success toast: "Cita marcada como no show."
9. If the email checkbox was checked AND the patient has an email address on file, system sends a no-show notification email via the existing Resend email infrastructure.
10. The calendar event visually updates to reflect the `no_show` status (amber/orange color or icon).

**Edge Cases:**
- Patient has no email address: The email checkbox is still visible but disabled, with a tooltip or helper text: "El paciente no tiene correo registrado."
- Appointment is already in the past by several days: No restriction -- staff should be able to mark old appointments retroactively.
- Doctor changes their mind before confirming: "Cancelar" in the confirmation dialog returns to the popup without making changes.

**Error States:**
- Status update fails: Toast error "Error al marcar como no show," dialog stays open for retry.
- Email send fails: The status change still succeeds. A secondary toast warns: "No se pudo enviar el correo de notificacion." The status is NOT reverted due to email failure.

---

### Flow 3: Reschedule an Appointment

**Trigger:** Doctor or staff clicks on a `scheduled` appointment and selects "Reprogramar."

1. User clicks the appointment event on the calendar.
2. System displays the appointment popup with action buttons.
3. User clicks **Reprogramar**.
4. System opens the existing reschedule dialog (currently used for drag/resize operations) pre-populated with the current appointment details.
5. User selects a new date and time.
6. User clicks **Confirmar**.
7. System updates the appointment: changes the schedule to the new date/time and sets the status to `rescheduled`.
8. System creates a new appointment record with status `scheduled` for the new date/time (or updates the same record in-place -- this is an engineering decision).
9. System shows a success toast: "Cita reprogramada exitosamente."
10. The calendar reflects the updated schedule.

**Note:** The reschedule dialog already exists for drag-and-drop operations. This flow surfaces the same dialog via an explicit button in the appointment popup, making it more discoverable.

**Edge Cases:**
- The new time slot conflicts with another appointment: System should validate and show an appropriate error before confirming.
- User cancels the reschedule: Dialog closes, no changes made.

**Error States:**
- Update failure: Toast error, dialog stays open for retry.

---

### Flow 4: View No-Show History in Patient Profile

**Trigger:** Doctor or staff navigates to a patient's profile page.

1. User opens a patient's profile (via patient list or by clicking the patient name in an appointment popup).
2. System displays the patient detail page, including the appointment timeline (existing component).
3. The appointment timeline now displays `no_show` appointments with a distinct visual badge:
   - Badge color: Amber/orange (differentiated from red=cancelled, green=completed, blue=scheduled).
   - Badge label: "No Show"
   - Badge icon: An appropriate icon (e.g., UserX or AlertCircle).
4. The `rescheduled` status also appears in the timeline with its own distinct badge:
   - Badge color: A neutral or blue-tinted color.
   - Badge label: "Reprogramada"
5. No-show entries are sorted chronologically alongside all other appointment types in the existing "Historial de citas" section.

**Edge Cases:**
- Patient has zero no-shows: No special handling needed -- the timeline simply shows no `no_show` entries.
- Patient has many no-shows: The existing pagination/truncation logic ("+ X citas anteriores") applies.

---

### Flow 5: View No-Show Count on Dashboard

**Trigger:** Doctor logs in and views the dashboard.

1. User lands on the dashboard page.
2. The Quick Stats section (desktop) now shows a fourth card: **"No-shows hoy"** with the count of today's appointments marked as `no_show`.
3. The card uses a distinct color (amber/orange) to differentiate it from existing stats.
4. The count updates when the user returns to the dashboard after marking a no-show.

**Edge Cases:**
- Zero no-shows today: Card displays "0" (not hidden).
- Mobile view: The dashboard header/mobile layout should also surface this stat in an appropriate location.

---

### Flow 6: View No-Show Metrics in Reports

**Trigger:** Doctor navigates to the Reports page.

1. User opens the Reports page.
2. The KPI cards section now includes a fifth card: **"No-shows"** showing the count of no-show appointments for the current month.
3. Below or alongside the no-show count, the **no-show rate** is displayed (no-shows / total scheduled appointments for the period, as a percentage).
4. In the chart/breakdown area, a new section shows **no-shows by period**:
   - Default view: Weekly breakdown for the current month.
   - Each row/bar shows: period label, no-show count, and no-show rate.
5. Optionally (if data is available), a "No-show rate per patient" list shows the top patients by no-show frequency. This is a secondary priority.

**Edge Cases:**
- No appointments in the period: Show "0" for count and "0%" for rate, not an error state.
- Period with only no-shows: Rate shows "100%."
- The existing PDF export should include the new no-show metrics.

---

### Flow 7: Revert a No-Show (Correction)

**Trigger:** Staff accidentally marked an appointment as no-show and needs to correct it.

1. User clicks on an appointment with `no_show` status in the calendar or patient profile.
2. System displays the appointment popup showing the "No Show" status badge.
3. A **"Reactivar Cita"** button is shown (similar to the existing cancelled appointment reactivation flow).
4. User clicks **Reactivar Cita**.
5. System reverts the appointment status back to `scheduled`.
6. System shows a success toast: "Cita reactivada correctamente."

**Edge Cases:**
- The appointment date has already passed: Reactivation is still allowed (the doctor may want to then mark it as completed instead).

---

## Flow-Specific Acceptance Criteria

### Flow 1: Mark Appointment as Completed

1. The **Completar** button appears only for appointments with status `scheduled`.
2. Clicking **Completar** navigates the user to the medical record creation form with the appointment context pre-filled.
3. After saving the medical record, the appointment status is `completed` and the calendar reflects this immediately.

### Flow 2: Mark Appointment as No-Show

1. The **No Show** button appears only for appointments with status `scheduled`.
2. Clicking **No Show** opens a confirmation dialog before any status change occurs.
3. The confirmation dialog includes an optional email notification checkbox, unchecked by default.
4. The email checkbox is disabled (not hidden) when the patient has no email on file.
5. After confirmation, the appointment status is `no_show` in the database and all UI surfaces update accordingly.
6. If the email option is selected and the patient has an email, a no-show notification email is sent. Email failure does not block or revert the status change.
7. A `no_show` appointment appears with an amber/orange badge (distinct from cancelled=red) across all views: calendar, popup, patient profile, and reports.

### Flow 3: Reschedule an Appointment

1. The **Reprogramar** button appears for appointments with status `scheduled`.
2. Clicking **Reprogramar** opens the reschedule dialog, allowing the user to pick a new date and time.
3. On confirmation, the original appointment status changes to `rescheduled` and the new time is reflected on the calendar.
4. The rescheduled appointment appears with a distinct badge ("Reprogramada") in the patient timeline.

### Flow 4: View No-Show History in Patient Profile

1. The patient appointment timeline displays a distinct visual badge for `no_show` status (amber/orange, with "No Show" label).
2. The patient appointment timeline displays a distinct visual badge for `rescheduled` status (with "Reprogramada" label).
3. No-show appointments appear in chronological order alongside all other appointment types.
4. The timeline section header counts include no-show appointments in the total.

### Flow 5: View No-Show Count on Dashboard

1. A "No-shows hoy" stat card appears in the dashboard Quick Stats section.
2. The card shows the correct count of today's `no_show` appointments.
3. The card uses amber/orange theming to be visually distinct.
4. The count is "0" when there are no no-shows (card is always visible).

### Flow 6: View No-Show Metrics in Reports

1. A "No-shows" KPI card appears alongside existing report KPIs, showing the monthly count.
2. A no-show rate percentage is displayed (no-shows / total appointments for the period).
3. A period breakdown (weekly or monthly) is available showing no-show counts and rates over time.
4. All new metrics are included in the PDF export.
5. No-show rate per patient is a secondary priority and may be deferred.

### Flow 7: Revert a No-Show

1. Appointments with `no_show` status show a **Reactivar Cita** button in the popup.
2. Clicking **Reactivar Cita** reverts the status to `scheduled`.
3. The reactivation works regardless of whether the appointment date is in the past or future.

---

## Out of Scope

- Automated no-show detection (e.g., auto-marking based on time elapsed). All outcome marking is manual.
- SMS notifications. Only email notifications are supported via the existing Resend infrastructure.
- No-show penalties or fees.
- Waitlist management to fill no-show slots.
- Changing the behavior of the existing `cancelled` status.
- Patient-facing portal or self-service rescheduling.

---

## Dependencies

- **Existing reschedule dialog** (`reschedule-dialog.tsx`): Must be adapted or extended to work when triggered from the appointment popup button (currently only triggered by calendar drag/resize).
- **Existing email infrastructure** (Supabase Edge Function + Resend API): The no-show notification email will use the same Resend setup already configured for appointment reminders. A new email template is needed.
- **Appointment popup** (`appointment-popup.tsx`): The primary surface for outcome actions. Must be extended with new buttons and states.
- **Patient appointments component** (`patient-appointments.tsx`): Must support the two new statuses with appropriate visual badges.
- **Dashboard page** (`dashboard/page.tsx`): Must add a new stat card.
- **Reports page** (`reports/page.tsx`): Must add new KPI card and breakdown section.
- **Type definitions** (`src/types/app.ts`): The `AppointmentStatus` type must be extended to include `no_show` and `rescheduled`.

---

## Success Metrics

- 100% of completed appointments are tracked with a specific outcome (completed, no-show, rescheduled, or cancelled) rather than remaining in `scheduled` status indefinitely.
- Doctors can mark any appointment outcome in under 3 clicks from the calendar view.
- No-show data is accurately reflected across all three surfaces: patient profile, dashboard, and reports.
- No-show notification emails are delivered successfully when opted into (dependent on patient having an email on file).

---

## Handoff to Engineering Architect

This specification is complete and ready for the engineering architect agent. The next steps are:

1. Design the technical architecture (database migration, server actions, component changes).
2. Break down the work into implementation tickets.
3. Define the order of implementation and any technical dependencies.

All product decisions have been made in this document. Technical design and implementation planning are the responsibility of the engineering architect.
