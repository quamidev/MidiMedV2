# Manual Setup Required

**Feature:** Appointment Outcomes (No-show, Complete, Reschedule)
**Date:** 2026-03-02

## Checklist

Use this checklist to complete the manual setup for this feature.

### Database Migration
- [ ] Apply the new migration to your Supabase database:
  ```bash
  supabase db push
  ```
  Or manually run: `supabase/migrations/00021_add_appointment_outcome_statuses.sql`

### Environment Variables
- [ ] Verify `RESEND_API_KEY` is set in your Next.js environment (`.env.local` and production)
  - This is required for the optional no-show email notification feature
  - The key should already be configured if appointment reminders are working

### Email Configuration
- [ ] Update the "from" email address in `src/actions/appointments.ts` (line ~850) if needed:
  - Current: `from: 'MidiMed <noreply@midimed.com>'`
  - Change to your verified Resend domain if different

---

**Note:** No additional third-party services or new environment variables are required beyond what's already configured for the existing email functionality.
