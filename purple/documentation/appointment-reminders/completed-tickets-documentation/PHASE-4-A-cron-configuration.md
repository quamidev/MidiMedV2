# PHASE-4-A: Cron Job Configuration Migration

## What was implemented

Created a database migration that enables `pg_cron` and `pg_net` extensions, stores placeholder project URL and anon key values in Supabase Vault, and schedules an hourly cron job named `send-appointment-reminders` that invokes the `appointment-reminders` Edge Function via `net.http_post`. The cron job runs at minute 0 of every hour (`0 * * * *`), sending a `{"source": "cron"}` JSON body so invocations can be identified in logs. The migration includes thorough documentation comments covering Vault secret replacement for production, verification queries, execution history inspection, unschedule commands, and the local development limitation where `pg_cron` is unavailable.

## Key technical decisions

- Followed the ticket-specified `INSERT INTO vault.secrets ... ON CONFLICT (name) DO UPDATE` pattern for idempotent secret creation. This allows the migration to be safely re-applied without failing on duplicate secret names, and makes it straightforward to update placeholder values in production by simply re-running the insert with real values.
- Used `CREATE EXTENSION IF NOT EXISTS` for both `pg_cron` (in `pg_catalog` schema) and `pg_net` (in `extensions` schema) to ensure the migration is safe to run regardless of whether the extensions were already enabled on the Supabase project.
- Included the `cron.job_run_details` query in the verification comments, not just the `cron.job` check, so operators can inspect execution history after the first run completes.
- Documented the local development workaround (manual curl invocation) since `pg_cron` requires the hosted Supabase infrastructure and does not function in local `supabase start` environments.

## Files created or modified

- `supabase/migrations/00020_create_appointment_reminder_cron.sql` -- New migration enabling pg_cron/pg_net, storing Vault secrets, and scheduling the hourly cron job.

## Testing performed

- `npm run build` -- the only failure is the pre-existing `playwright` import in `purple/documentation/ai-dictation/qa-test.ts`, which is unrelated to this ticket (documented in PHASE-1-A completion notes).
- `npm run lint` -- all reported issues (4 errors, 37 warnings) are pre-existing in unrelated files (`custom-field-editor.tsx`, `reports-export.ts`). The SQL migration file is not processed by the linter.
- Verified the SQL syntax follows valid PostgreSQL conventions and matches the Supabase documentation pattern for scheduling Edge Functions with pg_cron and pg_net.

## Known limitations

- The migration has not been run against a live Supabase instance yet. It should be applied via `supabase db push` or the Supabase dashboard migration runner.
- The Vault secrets contain placeholder values (`YOUR_PROJECT_REF`, `YOUR_ANON_KEY_HERE`) that must be replaced with actual values before the cron job will successfully invoke the Edge Function. This is documented in the migration comments.
- `pg_cron` does not work in local development environments (`supabase start`). For local testing, the Edge Function must be invoked manually via curl as documented in the migration comments.
- The cron job depends on the `appointment-reminders` Edge Function being deployed (PHASE-3-A). If the function is not deployed, the HTTP POST will return an error, but the cron job itself will continue scheduling.
