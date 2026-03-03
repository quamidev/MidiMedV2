# Appointment Outcome Management (No-show, Complete, Reschedule)

**GitHub Issue:** #5
**Repo:** quamidev/MidiMedV2

## Summary
Allow doctors to mark the outcome of each appointment from the calendar or appointment view. Track no-shows in patient history and show stats in reports.

## Outcomes
- ✅ Completada → opens medical record form directly
- ❌ No show → records absence, optional email to patient, logged in patient history
- 🔄 Reprogramar → quick reschedule (already exists, surface more prominently)

## Scope

### DB
- Extend appointment status to include: `completed`, `no_show`, `rescheduled`
- Migration if needed

### UI
- Action buttons on calendar event / appointment popup: Complete | No show | Reschedule
- No-show confirmation dialog (with optional email to patient)
- Patient profile: show no-shows in appointment timeline with clear visual indicator (e.g. red badge)
- Dashboard: no-show count for today

### Reports
- Add no-show count and rate to reports page
- Show no-shows per period (week/month)
- No-show rate per patient (optional)

## Notes
- PR targets `development` branch
- Optional email to patient on no-show via existing Resend setup
