# AO-005 & AO-006: Appointment Popup UI - No Show and Reschedule Buttons

## What Was Implemented

**AO-005** added No Show and Reschedule action buttons to the appointment popup for scheduled appointments, along with a Reactivar button for no_show status and a descriptive message for rescheduled status. The button layout was reorganized into three rows: Row 1 has Editar, No Show (amber), and Cancelar side by side; Row 2 has Reprogramar (full width, conditional on onReschedule callback); Row 3 has Completar (full width, primary). The `AppointmentPopupBaseProps` and `PopupContentProps` interfaces were extended with `onReschedule` and `onShowNoShowDialog` props respectively.

**AO-006** created the `NoShowConfirmDialog` component, a confirmation dialog that displays when staff clicks the No Show button. It shows an amber warning icon, the patient name and appointment date/time, and an email notification checkbox. The checkbox is disabled with an explanatory message when the patient has no registered email. On confirmation, it calls the `markNoShow` server action with the email preference and surfaces success/error via toast notifications.

## Files Created or Modified

- **Created:** `src/components/appointments/no-show-confirm-dialog.tsx` - New NoShowConfirmDialog component
- **Modified:** `src/components/appointments/appointment-popup.tsx` - Added No Show/Reschedule buttons, no_show/rescheduled status handling, NoShowConfirmDialog integration

## Key Technical Decisions

- The No Show button uses amber color styling (text-amber-600, border-amber-200/dark:border-amber-800) to visually distinguish it from the destructive Cancel button
- The NoShowConfirmDialog manages its own loading state and calls the markNoShow server action directly, then delegates cleanup (closing popup, refreshing data) to the parent via onConfirm callback
- The email checkbox state resets to unchecked when the dialog is dismissed to prevent stale state on re-open

## Testing Performed

- `npm run build` passes with no errors
- `npm run lint` shows no warnings or errors in the modified/created files (all lint issues are pre-existing in unrelated files)

## Deviations from Spec

None. Implementation follows the specification exactly.
