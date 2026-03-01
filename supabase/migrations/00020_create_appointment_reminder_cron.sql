-- MidiMed v2: Appointment Reminder Cron Job Configuration
-- Created: 2026-03-01
-- Ticket: PHASE-4-A - Cron Job Configuration Migration
-- Description: Enables pg_cron and pg_net extensions, stores project URL and anon key
--              in Supabase Vault, and creates an hourly cron job that invokes the
--              appointment-reminders Edge Function via net.http_post.

-- =============================================================================
-- EXTENSIONS: Enable pg_cron and pg_net
-- pg_cron: PostgreSQL job scheduler for recurring tasks
-- pg_net: Async HTTP requests from within PostgreSQL
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- =============================================================================
-- VAULT SECRETS: Store project URL and anon key
--
-- IMPORTANT: These are placeholder values. Before deploying to production, you
-- MUST update these secrets with your actual project URL and anon key.
--
-- Option 1 - Update via Supabase SQL Editor:
--   UPDATE vault.secrets SET secret = 'https://YOUR_ACTUAL_PROJECT_REF.supabase.co'
--     WHERE name = 'project_url';
--   UPDATE vault.secrets SET secret = 'YOUR_ACTUAL_ANON_KEY'
--     WHERE name = 'anon_key';
--
-- Option 2 - Use Supabase Vault functions:
--   SELECT vault.update_secret('<uuid>', 'https://YOUR_ACTUAL_PROJECT_REF.supabase.co');
--   SELECT vault.update_secret('<uuid>', 'YOUR_ACTUAL_ANON_KEY');
--
-- You can find your project URL and anon key in the Supabase dashboard under
-- Settings > API.
-- =============================================================================

INSERT INTO vault.secrets (name, secret)
VALUES
  ('project_url', 'https://YOUR_PROJECT_REF.supabase.co'),
  ('anon_key', 'YOUR_ANON_KEY_HERE')
ON CONFLICT (name) DO UPDATE SET secret = EXCLUDED.secret;

-- =============================================================================
-- CRON JOB: send-appointment-reminders
-- Schedule: Every hour at minute 0 (0 * * * *)
--
-- This job invokes the appointment-reminders Edge Function via an HTTP POST
-- request. The Edge Function queries eligible appointments and sends reminder
-- emails via the Resend API.
--
-- The 2-hour-wide query windows in the Edge Function ensure that a single
-- missed cron run does not cause missed reminders.
--
-- NOTE: pg_cron may not work in local development environments. For local
-- testing, invoke the Edge Function manually via curl:
--   curl -X POST http://127.0.0.1:54321/functions/v1/appointment-reminders \
--     -H "Authorization: Bearer <local_anon_key>" \
--     -H "Content-Type: application/json" \
--     -d '{"source": "manual"}'
-- =============================================================================

SELECT cron.schedule(
  'send-appointment-reminders',
  '0 * * * *',  -- Every hour at minute 0
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/appointment-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key')
    ),
    body := '{"source": "cron"}'::jsonb
  );
  $$
);

-- =============================================================================
-- VERIFICATION
--
-- After applying this migration, verify the cron job was created:
--   SELECT * FROM cron.job WHERE jobname = 'send-appointment-reminders';
--
-- To check execution history (after at least one run):
--   SELECT * FROM cron.job_run_details
--     WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'send-appointment-reminders')
--     ORDER BY start_time DESC
--     LIMIT 10;
--
-- To unschedule (disable) the cron job:
--   SELECT cron.unschedule('send-appointment-reminders');
-- =============================================================================
