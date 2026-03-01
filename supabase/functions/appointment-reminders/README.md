# Appointment Reminders Edge Function

## Overview

This Supabase Edge Function sends automated email reminders to patients before their scheduled appointments. It is invoked hourly by a `pg_cron` job and processes all tenants in a single run. Two reminder intervals are supported:

- **24-hour reminder** -- sent approximately 24 hours before the appointment
- **2-hour reminder** -- sent approximately 2 hours before the appointment

The function queries the `appointments` table for eligible rows (status `scheduled`, patient has an email, reminder flag not yet set), renders branded Spanish-language HTML emails, and delivers them via the Resend API. Idempotency is enforced through boolean flag columns (`reminder_24h_sent`, `reminder_2h_sent`) on the `appointments` table, which are set to `TRUE` only after a successful Resend API response.

---

## Prerequisites

Before deploying this function, ensure the following are in place:

1. **Supabase project** on a paid plan (pg_cron requires Pro plan or higher)
2. **Supabase CLI** installed locally ([installation guide](https://supabase.com/docs/guides/cli))
3. **Database migrations applied** -- migrations `00019` and `00020` must be applied (see Deployment Steps below)
4. **Resend account** with a verified sending domain (see Resend Account Setup below)
5. **Node.js/Bun** for running build and lint checks on the main application

---

## Resend Account Setup

1. Create an account at [https://resend.com](https://resend.com)
2. Navigate to **Domains** and add your sending domain (e.g., `midimed.app`)
3. Complete domain verification by adding the required DNS records (SPF, DKIM, DMARC) as instructed by Resend
4. Navigate to **API Keys** and create a new key with **Send** permission only
5. Copy the API key (format: `re_xxxxxxxx`) -- you will need it for the secrets step below

**Free tier limits:**
- 3,000 emails per month
- This supports approximately 1,500 appointments per month (each appointment can receive up to 2 reminder emails)
- Monitor usage in the Resend dashboard and upgrade before reaching the limit

---

## Deployment Steps (Ordered)

Follow these steps in order to activate the reminder system in production.

### Step 1: Run Database Migrations

Apply both reminder-related migrations to the production database:

```bash
supabase db push
```

This applies:
- `00019_add_appointment_reminder_columns.sql` -- adds `reminder_24h_sent` and `reminder_2h_sent` columns, a partial index, and a reschedule trigger
- `00020_create_appointment_reminder_cron.sql` -- enables `pg_cron` and `pg_net`, creates Vault secret placeholders, and schedules the hourly cron job

### Step 2: Set Resend API Key

Store the Resend API key as an Edge Function secret:

```bash
supabase secrets set RESEND_API_KEY=re_xxxxx
```

Replace `re_xxxxx` with your actual Resend API key from Step 4 of the Resend Account Setup above.

### Step 3: Deploy Edge Function

Deploy the `appointment-reminders` Edge Function to your Supabase project:

```bash
supabase functions deploy appointment-reminders
```

### Step 4: Update Vault Secrets

The cron job migration created placeholder Vault secrets for the project URL and anon key. You must update these with your actual values.

Open the **SQL Editor** in the Supabase dashboard and run:

```sql
UPDATE vault.secrets
SET secret = 'https://YOUR_ACTUAL_PROJECT_REF.supabase.co'
WHERE name = 'project_url';

UPDATE vault.secrets
SET secret = 'YOUR_ACTUAL_ANON_KEY'
WHERE name = 'anon_key';
```

You can find your project URL and anon key in the Supabase dashboard under **Settings > API**.

### Step 5: Verify Cron Job

Confirm the cron job was created by running this query in the SQL Editor:

```sql
SELECT * FROM cron.job WHERE jobname = 'send-appointment-reminders';
```

You should see one row with schedule `0 * * * *` (every hour at minute 0).

### Step 6: Monitor First Run

After the next hour mark, check the Edge Function logs in the Supabase dashboard:

1. Go to **Edge Functions** in the Supabase dashboard
2. Select `appointment-reminders`
3. Open the **Logs** tab
4. Verify the function was invoked and returned a JSON response with `total_eligible`, `sent_24h`, `sent_2h`, and `errors` counts

You can also check cron execution history:

```sql
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'send-appointment-reminders')
ORDER BY start_time DESC
LIMIT 10;
```

### Step 7: Verify Email Delivery

1. Log in to the [Resend dashboard](https://resend.com)
2. Navigate to **Emails** to see sent emails and their delivery status
3. Confirm that reminder emails were delivered to the expected patient email addresses

---

## Environment Variables

| Variable | Where | How to Set |
|----------|-------|------------|
| `RESEND_API_KEY` | Edge Function secrets | `supabase secrets set RESEND_API_KEY=re_xxxxx` |
| `SUPABASE_URL` | Auto-provided by Supabase | N/A (automatically available in Edge Functions) |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-provided by Supabase | N/A (automatically available in Edge Functions) |

**Vault secrets** (used by the cron job, not by the Edge Function directly):

| Secret Name | Purpose | How to Set |
|-------------|---------|------------|
| `project_url` | Supabase project URL for cron HTTP POST | SQL Editor (see Step 4 above) |
| `anon_key` | Supabase anon key for cron Authorization header | SQL Editor (see Step 4 above) |

---

## Local Development

### Prerequisites

- Local Supabase instance running (`supabase start`)
- Supabase CLI installed

### Serve the Edge Function

```bash
supabase functions serve appointment-reminders \
  --env-file supabase/functions/.env.local \
  --no-verify-jwt
```

The `--no-verify-jwt` flag is required because the cron job sends the anon key (not a user JWT) and locally there is no JWT verification context.

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically injected by `supabase functions serve` from the local Supabase instance.

### Configure the `.env.local` File

The file `supabase/functions/.env.local` is already created and gitignored. Replace the placeholder with a real or test Resend API key:

```
RESEND_API_KEY=re_test_xxxxx
```

Use a Resend **test** API key (prefix `re_test_`) to avoid sending real emails during local development. Test keys accept API calls but do not deliver emails.

### Invoke Locally

```bash
curl -X POST http://127.0.0.1:54321/functions/v1/appointment-reminders \
  -H "Content-Type: application/json" \
  -d '{"source": "manual"}'
```

### Local Testing Notes

- `pg_cron` does **not** work in local development environments. Use the `curl` command above to invoke the function manually.
- Seed your local database with at least one appointment that has:
  - `status = 'scheduled'`
  - `scheduled_start` within the 24h window (23-25 hours from now) or the 2h window (1-3 hours from now)
  - A linked patient with a non-null `email` field
- After invoking, verify the response JSON and check that the corresponding `reminder_24h_sent` or `reminder_2h_sent` flag was set to `TRUE` in the database.

---

## Rollback Plan

If you need to disable the reminder system:

### 1. Disable the Cron Job

```sql
SELECT cron.unschedule('send-appointment-reminders');
```

This stops the hourly invocation immediately. The Edge Function remains deployed but is no longer called automatically.

### 2. Remove the Edge Function (optional)

```bash
supabase functions delete appointment-reminders
```

### 3. Database Columns

The `reminder_24h_sent` and `reminder_2h_sent` columns are **safe to leave in place**. They are boolean columns with `DEFAULT FALSE` and do not affect any existing application functionality. Removing them is not necessary for rollback.

To re-enable the system after a rollback, re-schedule the cron job:

```sql
SELECT cron.schedule(
  'send-appointment-reminders',
  '0 * * * *',
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
```

---

## Monitoring

### Edge Function Logs

Check the Edge Function logs in the Supabase dashboard:

1. Go to **Edge Functions > appointment-reminders > Logs**
2. Each successful run logs a JSON response with:
   - `total_eligible` -- number of appointments that qualified for a reminder
   - `sent_24h` -- number of 24-hour reminders sent
   - `sent_2h` -- number of 2-hour reminders sent
   - `errors` -- number of failed email sends
3. Errors are logged with `console.error` and include the appointment ID and error details

### Cron Job Execution History

```sql
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'send-appointment-reminders')
ORDER BY start_time DESC
LIMIT 10;
```

### Resend Dashboard

1. Log in to [https://resend.com](https://resend.com)
2. Check the **Emails** section for delivery status (delivered, bounced, etc.)
3. Check the **API Keys** section for usage statistics

### Free Tier Monitoring

- The Resend free tier allows 3,000 emails per month
- Each appointment may generate up to 2 emails (24h + 2h reminders)
- Monitor your monthly usage in the Resend dashboard under **Usage**
- Plan to upgrade to a paid Resend plan when approaching the 3,000 email limit
- If the limit is exceeded, the Resend API will return errors and reminders will not be sent until the next billing cycle or until you upgrade

---

## Architecture Reference

```
                     pg_cron (hourly, 0 * * * *)
                          |
                          | HTTP POST via pg_net
                          v
             +--------------------------+
             | Edge Function            |
             | appointment-reminders    |
             |                          |
             | 1. Query eligible appts  |
             | 2. For each appointment: |
             |    a. Build HTML email   |
             |    b. POST to Resend API |
             |    c. Update flag in DB  |
             | 3. Return JSON summary   |
             +--------------------------+
                  |              |
                  v              v
          +------------+  +-------------+
          | Supabase   |  | Resend API  |
          | PostgreSQL |  | (email      |
          | (service   |  |  delivery)  |
          |  role)     |  +-------------+
          +------------+
```

### Related Files

| File | Purpose |
|------|---------|
| `supabase/functions/appointment-reminders/index.ts` | Edge Function entry point with query, send, and update logic |
| `supabase/functions/appointment-reminders/_templates/reminder-email.ts` | HTML email template builder functions |
| `supabase/functions/.env.local` | Local development environment variables (gitignored) |
| `supabase/migrations/00019_add_appointment_reminder_columns.sql` | Adds reminder columns, index, and reschedule trigger |
| `supabase/migrations/00020_create_appointment_reminder_cron.sql` | Enables pg_cron/pg_net, Vault secrets, and hourly schedule |
