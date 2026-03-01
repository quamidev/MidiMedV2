# Email Appointment Reminders

**GitHub Issue:** #3
**Repo:** quamidev/MidiMedV2

## Summary
Send automated email reminders to patients before appointments using a Supabase scheduled Edge Function and Resend.

## How it works
- Edge function runs every hour via Supabase cron
- Queries appointments in 24h window (now+23h → now+25h) and 2h window (now+1h → now+3h)
- Checks `reminder_24h_sent` / `reminder_2h_sent` booleans on appointment before sending
- Sends email via Resend, marks boolean true after — idempotent, no duplicates

## Scope

### DB changes
- Add `reminder_24h_sent boolean DEFAULT false` to appointments table
- Add `reminder_2h_sent boolean DEFAULT false` to appointments table
- Supabase migration file

### Edge Function
- `supabase/functions/appointment-reminders/index.ts`
- Runs every hour via Supabase cron scheduler
- Queries both time windows in one DB call
- Calls Resend API to send emails
- Updates boolean columns after successful send

### Email Template
- React Email component matching MidiMed brand (teal #0d9488, Spanish)
- Shows: patient name, date/time, doctor name, clinic name
- Two variants: 24h reminder and 2h reminder (slightly different copy)
- Responsive, clean card layout

### Environment
- `RESEND_API_KEY` added to Supabase Edge Function secrets
- Sender: `noreply@[domain]`

## Notes
- No separate reminders table — idempotency via boolean columns on appointments
- PR targets `development` branch
- Resend free tier: 3,000 emails/month
