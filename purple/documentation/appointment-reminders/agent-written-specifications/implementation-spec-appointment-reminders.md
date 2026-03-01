# Engineering Implementation Specification: Email Appointment Reminders

**Feature:** Email Appointment Reminders
**GitHub Issue:** #3
**Status:** Ready for Implementation
**Date:** 2026-03-01
**Author:** Engineering Architect Agent

---

## 1. Executive Summary

This feature adds automated email reminders sent to patients at two intervals before scheduled appointments: 24 hours and 2 hours. The system consists of a Supabase Edge Function invoked hourly by a `pg_cron` job, which queries eligible appointments, renders Spanish-language HTML emails, and delivers them via the Resend API. Idempotency is enforced through boolean flag columns on the `appointments` table.

**Key Technical Decisions:**

- **Edge Function over Server Action:** This is a background job with no user-initiated trigger, making a Supabase Edge Function (invoked by cron) the correct pattern. Server Actions require a user request context.
- **Direct Resend API via `fetch`:** The Edge Function runs on Deno. Rather than importing the `resend` npm package, use the native `fetch` API to call `https://api.resend.com/emails` directly. This avoids npm compatibility issues in Deno and keeps the function lightweight.
- **Inline HTML templates (no React Email):** React Email's `render()` requires JSX compilation which adds complexity in the Deno Edge Function runtime. Instead, build HTML email strings using template literals with the MidiMed brand colors. This is simpler, has zero dependencies, and the email layout is straightforward (a single reminder card).
- **Boolean columns for idempotency:** Two columns (`reminder_24h_sent`, `reminder_2h_sent`) on the existing `appointments` table. Simpler than a separate `reminder_log` table and sufficient for two fixed intervals.
- **Service role key for Edge Function auth:** The cron job invokes the Edge Function. The function itself uses the Supabase service role key (available as `SUPABASE_SERVICE_ROLE_KEY` env var in Edge Functions) to query across all tenants, bypassing RLS. This is the documented pattern for background jobs.
- **Reschedule flag reset: V1 limitation.** Resetting `reminder_24h_sent` / `reminder_2h_sent` when `scheduled_start` changes requires a database trigger. This is included as a Phase 1 deliverable via a simple trigger function.

**Estimated Scope:** 4 phases, 6 tickets. One engineer can complete this in 3-5 days.

---

## 2. Technical Architecture

### System Flow Diagram

```
                         pg_cron (hourly)
                              |
                              | HTTP POST via pg_net
                              v
                 +--------------------------+
                 | Supabase Edge Function   |
                 | appointment-reminders    |
                 |                          |
                 | 1. Auth: verify request  |
                 | 2. Query eligible appts  |
                 | 3. For each appointment: |
                 |    a. Build HTML email   |
                 |    b. POST to Resend API |
                 |    c. On success: UPDATE |
                 |       reminder flag      |
                 | 4. Return summary        |
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

### Database Changes

**Modified Table: `appointments`**

Add two boolean columns and an index to support the reminder query:

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `reminder_24h_sent` | `BOOLEAN` | `FALSE` | Idempotency flag for 24h reminder |
| `reminder_2h_sent` | `BOOLEAN` | `FALSE` | Idempotency flag for 2h reminder |

**New Index:**

A composite index to support the reminder eligibility query efficiently:

```
idx_appointments_reminder_eligibility ON appointments(status, scheduled_start)
WHERE status = 'scheduled'
```

**New Trigger:**

A `BEFORE UPDATE` trigger on `appointments` that resets both reminder flags to `FALSE` when `scheduled_start` changes. This handles the reschedule case.

### Query Strategy

A single query fetches all appointments eligible for either reminder type. The query uses a `CASE` expression or `OR` condition to identify rows that need a 24h reminder OR a 2h reminder in the current window.

**24h window:** `scheduled_start` between `NOW() + INTERVAL '23 hours'` and `NOW() + INTERVAL '25 hours'`, where `reminder_24h_sent = FALSE`.

**2h window:** `scheduled_start` between `NOW() + INTERVAL '1 hour'` and `NOW() + INTERVAL '3 hours'`, where `reminder_2h_sent = FALSE`.

Both conditions also require:
- `status = 'scheduled'`
- Patient has a non-null email (joined from `patients` table)

The query joins `appointments` with `patients` (for email, name), `users` (for provider name), and `tenants` (for clinic name).

### Data Shapes

**Query result row shape:**
```typescript
interface ReminderEligibleAppointment {
  id: string                    // appointment UUID
  tenant_id: string
  scheduled_start: string       // ISO 8601 TIMESTAMPTZ
  patient_first_name: string
  patient_last_name: string
  patient_email: string
  provider_name: string         // users.display_name
  clinic_name: string           // tenants.name
  needs_24h: boolean            // whether this row qualifies for 24h reminder
  needs_2h: boolean             // whether this row qualifies for 2h reminder
}
```

**Resend API request shape:**
```typescript
interface ResendEmailPayload {
  from: string                  // "MidiMed <noreply@midimed.app>"
  to: string[]                  // [patient_email]
  subject: string               // Spanish subject line
  html: string                  // Rendered HTML email
}
```

**Edge Function response shape:**
```typescript
interface ReminderRunResult {
  total_eligible: number
  sent_24h: number
  sent_2h: number
  errors: number
}
```

### Environment Variables (Edge Function)

The Edge Function has automatic access to these Supabase-provided env vars:
- `SUPABASE_URL` -- project URL
- `SUPABASE_SERVICE_ROLE_KEY` -- service role key (bypasses RLS)

Additional secret needed:
- `RESEND_API_KEY` -- Resend API key, set via `supabase secrets set RESEND_API_KEY=re_xxxxx`

### Email Design

Both email templates share a common layout:

- **Brand color:** Teal `#0d9488` (matches MidiMed primary from `globals.css`)
- **Layout:** Single-column card, max-width 600px, centered
- **Content (Spanish):**
  - Header with MidiMed branding
  - Greeting: "Hola, [patient first name]"
  - Reminder message (distinct copy for 24h vs 2h)
  - Appointment details card: date, time, doctor, clinic
  - Footer with clinic name
- **24h subject:** "Recordatorio: Tu cita es manana"
- **2h subject:** "Recordatorio: Tu cita es en 2 horas"

---

## 3. Implementation Phases

### Phase 1: Database Migration

**Objective:** Add reminder tracking columns, index, and reschedule trigger to the `appointments` table.

**Dependencies:** None. This is the foundation.

**Success Criteria:**
- Migration applies cleanly on a fresh database and on existing databases with appointment data
- Existing appointments get `reminder_24h_sent = FALSE` and `reminder_2h_sent = FALSE` defaults
- Updating `scheduled_start` on an appointment resets both flags to `FALSE`
- The `Appointment` TypeScript interface includes the new fields

---

### Phase 2: Email Templates

**Objective:** Create HTML email builder functions that produce branded, responsive email strings for both reminder intervals.

**Dependencies:** None. Can run in parallel with Phase 1.

**Success Criteria:**
- Two functions that accept appointment data and return HTML strings
- HTML renders correctly in Gmail, Outlook, and Apple Mail (table-based layout)
- All content is in Spanish
- Brand color `#0d9488` used consistently
- Date/time formatted for readability (e.g., "Lunes, 3 de marzo de 2026 a las 10:00 AM")

---

### Phase 3: Edge Function

**Objective:** Build the core Edge Function that queries eligible appointments, sends emails via Resend, and updates idempotency flags.

**Dependencies:** Phase 1 (database columns exist), Phase 2 (email templates exist).

**Success Criteria:**
- Function queries appointments needing 24h and/or 2h reminders in a single query
- For each eligible appointment, sends the correct email template via Resend
- Only marks the reminder flag as sent AFTER a successful Resend API response
- Skips appointments where patient has no email
- Handles Resend API errors gracefully (logs error, continues to next appointment)
- Returns a JSON summary of the run
- Works across all tenants without tenant-specific configuration

---

### Phase 4: Cron Setup

**Objective:** Configure `pg_cron` + `pg_net` to invoke the Edge Function every hour.

**Dependencies:** Phase 3 (Edge Function is deployed).

**Success Criteria:**
- Cron job runs every hour
- Job uses Supabase Vault for storing the project URL and anon key
- The invocation reaches the Edge Function and triggers the reminder logic
- Job can be verified via `cron.job` table

---

## 4. Tickets

### PHASE-1-A: Database Migration -- Add Reminder Columns and Reschedule Trigger

**Objective:** Add `reminder_24h_sent` and `reminder_2h_sent` boolean columns to the `appointments` table, create an optimized index for the reminder query, and add a trigger to reset flags on reschedule.

**Contract/Interface:**

SQL migration that:
1. Adds `reminder_24h_sent BOOLEAN NOT NULL DEFAULT FALSE`
2. Adds `reminder_2h_sent BOOLEAN NOT NULL DEFAULT FALSE`
3. Creates a partial index on `(status, scheduled_start) WHERE status = 'scheduled'` for the reminder query
4. Creates a trigger function `reset_reminder_flags()` that sets both columns to `FALSE` when `scheduled_start` changes
5. Attaches the trigger as `BEFORE UPDATE` on `appointments`

TypeScript interface update:
```typescript
// Add to existing Appointment interface in src/types/app.ts
reminder_24h_sent: boolean
reminder_2h_sent: boolean
```

**Files:**
- **Create:** `supabase/migrations/00019_add_appointment_reminder_columns.sql`
- **Modify:** `src/types/app.ts` -- add `reminder_24h_sent` and `reminder_2h_sent` to the `Appointment` interface

**Pattern Reference:**
- Migration naming/style: `supabase/migrations/00004_create_appointments.sql`
- Trigger pattern: `supabase/migrations/00017_create_triggers.sql` (see `set_updated_at_appointments` trigger)
- Type definition pattern: `src/types/app.ts` (see existing `Appointment` interface at line ~304)

**Key Considerations:**
- The migration must use `ALTER TABLE` (not `CREATE TABLE`) since the `appointments` table already exists
- Use `NOT NULL DEFAULT FALSE` so existing rows get the default without a data backfill step
- The partial index (`WHERE status = 'scheduled'`) keeps the index small by excluding completed/cancelled appointments
- The trigger function must compare `OLD.scheduled_start` with `NEW.scheduled_start` and only reset flags when the value actually changes
- The trigger function should be created in the same migration file (see `supabase/migrations/00016_create_functions.sql` for function creation pattern)
- Comments should follow the existing convention (see `COMMENT ON COLUMN` pattern in `00004`)

**Acceptance Criteria:**
- [ ] Migration file `00019_add_appointment_reminder_columns.sql` applies without error on existing database
- [ ] Both columns default to `FALSE` for all existing and new appointments
- [ ] Partial index `idx_appointments_reminder_eligibility` exists on `(status, scheduled_start) WHERE status = 'scheduled'`
- [ ] Updating `scheduled_start` on an appointment resets both flags to `FALSE`
- [ ] Updating other fields (e.g., `reason`, `status`) does NOT reset the flags
- [ ] `Appointment` TypeScript interface in `src/types/app.ts` includes `reminder_24h_sent: boolean` and `reminder_2h_sent: boolean`
- [ ] `bun run build` passes with no type errors

**Estimated Effort:** S (Small)

**Dependencies:** None

---

### PHASE-2-A: Email Template Builder Functions

**Objective:** Create two functions that generate branded HTML email strings for the 24-hour and 2-hour appointment reminders.

**Contract/Interface:**

```typescript
interface ReminderEmailData {
  patientFirstName: string
  appointmentDate: string       // ISO 8601 string
  providerName: string
  clinicName: string
}

function build24hReminderEmail(data: ReminderEmailData): string   // returns HTML string
function build2hReminderEmail(data: ReminderEmailData): string    // returns HTML string
```

Both functions return a complete HTML document string (with `<!DOCTYPE html>`, `<html>`, `<head>`, `<body>`).

The date formatting should convert the ISO string to a human-readable Spanish format like "Lunes, 3 de marzo de 2026 a las 10:00 AM". The Edge Function runs on Deno, so use `Intl.DateTimeFormat` with `es` locale (built into Deno, no dependencies needed).

**Files:**
- **Create:** `supabase/functions/appointment-reminders/_templates/reminder-email.ts`

**Pattern Reference:**
- Brand color: `#0d9488` (teal, from `src/app/globals.css` primary color definition)
- Spanish language standard: `purple/standards/business/general.md` (UI in Spanish, Latin American)

**Key Considerations:**
- Email HTML must use table-based layout for cross-client compatibility (Gmail, Outlook, Apple Mail)
- Do NOT use CSS `flexbox`, `grid`, or `<div>` for layout in email HTML -- use `<table>`, `<tr>`, `<td>`
- Inline all CSS styles (no `<style>` block or external stylesheets -- many email clients strip them)
- Keep the email width at `600px` max with `width="100%"` on the outer table for mobile
- Use web-safe fonts: Arial, Helvetica, sans-serif (Source Sans Pro from the app is not available in emails)
- The date formatting function must handle timezone-aware ISO strings correctly
- Both templates share the same layout structure; only the copy and subject line differ
- The 24h email uses a calm, informative tone: "Le recordamos que tiene una cita programada para manana"
- The 2h email uses a more urgent tone: "Su cita es en aproximadamente 2 horas"
- Export a helper to generate the subject line as well, since the Edge Function needs it for the Resend API call
- These functions must be pure (no side effects, no imports of external packages) for easy testing and portability
- File lives under `_templates/` with underscore prefix -- Supabase Edge Functions treat underscore-prefixed directories as shared modules, not as separate functions

**Acceptance Criteria:**
- [ ] `build24hReminderEmail()` returns valid HTML with correct Spanish copy for the 24h interval
- [ ] `build2hReminderEmail()` returns valid HTML with correct Spanish copy for the 2h interval
- [ ] Both emails display: patient first name, appointment date/time, provider name, clinic name
- [ ] Date is formatted in Spanish (e.g., "lunes, 3 de marzo de 2026 a las 10:00 AM")
- [ ] HTML uses table-based layout with inline styles
- [ ] Brand color `#0d9488` used for header/accents
- [ ] Email is responsive (renders correctly at 320px and 600px widths)
- [ ] No external dependencies (pure TypeScript with `Intl.DateTimeFormat`)

**Estimated Effort:** M (Medium)

**Dependencies:** None (can be built in parallel with Phase 1)

---

### PHASE-3-A: Edge Function -- Core Reminder Logic

**Objective:** Build the Supabase Edge Function that queries eligible appointments, sends emails via Resend, and updates idempotency flags.

**Contract/Interface:**

The Edge Function handler signature (Deno `serve` pattern):
```typescript
Deno.serve(async (req: Request): Promise<Response>)
```

Internal function signatures:
```typescript
function fetchEligibleAppointments(supabase: SupabaseClient): Promise<ReminderEligibleAppointment[]>
function sendReminder(appointment: ReminderEligibleAppointment, type: '24h' | '2h'): Promise<boolean>
function markReminderSent(supabase: SupabaseClient, appointmentId: string, type: '24h' | '2h'): Promise<void>
```

**Resend API call shape:**
```
POST https://api.resend.com/emails
Authorization: Bearer ${RESEND_API_KEY}
Content-Type: application/json

{
  "from": "MidiMed <noreply@midimed.app>",
  "to": ["patient@example.com"],
  "subject": "Recordatorio: Tu cita es manana",
  "html": "<html>...</html>"
}
```

**Response:**
```json
{
  "total_eligible": 5,
  "sent_24h": 2,
  "sent_2h": 3,
  "errors": 0
}
```

**Files:**
- **Create:** `supabase/functions/appointment-reminders/index.ts`

**Pattern Reference:**
- Supabase admin client pattern: `src/lib/supabase/admin.ts` -- same service role key pattern, but in Deno use `createClient` from `https://esm.sh/@supabase/supabase-js@2`
- JSDoc header pattern: `purple/standards/global/code-style.md`
- Error logging: use `console.error` (per code style standard)

**Key Considerations:**
- **Supabase client initialization in Deno:** Import `createClient` from the esm.sh CDN: `import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'`. Initialize with `Deno.env.get('SUPABASE_URL')` and `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')`.
- **Single query with computed columns:** The SQL query should join `appointments`, `patients`, `users`, and `tenants`, and compute `needs_24h` and `needs_2h` as boolean expressions in the SELECT. This avoids two separate queries.
- **Processing loop:** Iterate through results. For each appointment, determine which reminder(s) to send, build the email HTML, call Resend, and on success update the flag. Process sequentially (not in parallel) to respect Resend rate limits and simplify error handling.
- **Error isolation:** If sending one email fails, log the error and continue to the next appointment. Do NOT abort the entire run.
- **Flag update atomicity:** Update the boolean flag immediately after successful Resend response, before moving to the next appointment. This ensures that if the function crashes mid-run, already-sent reminders are not re-sent.
- **Authorization:** The cron job sends the request with the anon key in the `Authorization` header. The Edge Function can optionally validate this, but since it uses the service role key internally for DB access anyway, the main protection is that the function is not publicly advertised. For V1, verifying the `Authorization` header matches the expected anon key is sufficient.
- **Request method:** Accept `POST` only. Return 405 for other methods.
- **Sender address:** Use `MidiMed <noreply@midimed.app>` -- the domain must be verified in Resend. If using a different domain, update accordingly. Document as an environment consideration.
- **Edge Function timeout:** Supabase Edge Functions have a default timeout (typically 60s on free tier, extendable on paid). If there are many appointments to process, this could be a concern. For V1 with small clinics, this is not an issue. Log a warning if processing takes more than 30 seconds.
- **An appointment can qualify for BOTH 24h and 2h reminders in theory** (if somehow missed earlier). The query handles this -- both flags are independent. Process 24h first, then 2h, for the same appointment if applicable.

**Acceptance Criteria:**
- [ ] Edge Function deploys to `supabase/functions/appointment-reminders/index.ts`
- [ ] Queries appointments needing 24h reminder (scheduled_start between NOW()+23h and NOW()+25h, status=scheduled, reminder_24h_sent=FALSE, patient email not null)
- [ ] Queries appointments needing 2h reminder (scheduled_start between NOW()+1h and NOW()+3h, status=scheduled, reminder_2h_sent=FALSE, patient email not null)
- [ ] Single query fetches both types with joined patient/provider/tenant data
- [ ] For each eligible appointment, calls Resend API with correct email template
- [ ] Only sets `reminder_24h_sent = TRUE` or `reminder_2h_sent = TRUE` after successful Resend API response (HTTP 200)
- [ ] Does NOT mark as sent if Resend returns an error
- [ ] Logs errors with `console.error` and continues processing remaining appointments
- [ ] Returns JSON response with counts: `total_eligible`, `sent_24h`, `sent_2h`, `errors`
- [ ] Handles empty result set gracefully (returns zeros, no errors)
- [ ] Accepts only POST requests (returns 405 for others)

**Estimated Effort:** L (Large)

**Dependencies:** PHASE-1-A, PHASE-2-A

---

### PHASE-3-B: Edge Function -- Local Testing Setup

**Objective:** Document and configure the local development setup for testing the Edge Function with `supabase functions serve`.

**Contract/Interface:**

Environment file for local testing:
```
# supabase/functions/.env.local
RESEND_API_KEY=re_test_xxxxx
```

**Files:**
- **Create:** `supabase/functions/.env.local` (gitignored)
- **Modify:** `.gitignore` -- add `supabase/functions/.env.local` if not already covered

**Pattern Reference:**
- Existing `.gitignore` patterns in the project root

**Key Considerations:**
- `supabase functions serve` automatically injects `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from the local Supabase instance
- The `RESEND_API_KEY` must be provided separately via `--env-file` flag
- Test command: `supabase functions serve appointment-reminders --env-file supabase/functions/.env.local --no-verify-jwt`
- Invoke locally: `curl -X POST http://127.0.0.1:54321/functions/v1/appointment-reminders -H "Authorization: Bearer <local_anon_key>" -H "Content-Type: application/json"`
- The `--no-verify-jwt` flag is needed for local testing since the cron job sends the anon key, not a user JWT
- Seed data should include at least one appointment with `scheduled_start` in the appropriate window and a patient with an email address
- For testing without sending real emails, use Resend's test API key (prefix `re_test_`) which accepts requests but does not deliver

**Acceptance Criteria:**
- [ ] `.env.local` file exists with placeholder for `RESEND_API_KEY`
- [ ] `.gitignore` includes `supabase/functions/.env.local`
- [ ] Edge Function can be served locally with `supabase functions serve`
- [ ] Edge Function responds to local curl invocation

**Estimated Effort:** S (Small)

**Dependencies:** PHASE-3-A

---

### PHASE-4-A: Cron Job Configuration Migration

**Objective:** Create a database migration that sets up `pg_cron` and `pg_net` to invoke the Edge Function every hour.

**Contract/Interface:**

SQL migration that:
1. Enables `pg_cron` and `pg_net` extensions (if not already enabled)
2. Stores the project URL and anon key in Supabase Vault
3. Creates a cron job named `send-appointment-reminders` with schedule `0 * * * *` (every hour at minute 0)
4. The job uses `net.http_post` to invoke the Edge Function

**Files:**
- **Create:** `supabase/migrations/00020_create_appointment_reminder_cron.sql`

**Pattern Reference:**
- Supabase cron scheduling docs: https://supabase.com/docs/guides/functions/schedule-functions
- Migration naming convention: `supabase/migrations/00018_fix_rls_recursion.sql` (latest existing)

**Key Considerations:**
- `pg_cron` and `pg_net` extensions may already be enabled on the Supabase project. Use `CREATE EXTENSION IF NOT EXISTS` to be safe.
- The Vault secrets (`project_url` and `anon_key`) need to be set correctly for each environment (local vs production). In production, these are set via the Supabase dashboard or CLI. In the migration, use placeholder values and document that they must be updated.
- **IMPORTANT:** The Vault secrets in the migration will contain placeholder values. For production deployment, the actual project URL and anon key must be inserted into Vault manually via the Supabase SQL editor or dashboard. Document this in the migration comments.
- Cron expression `0 * * * *` runs at the top of every hour. This provides hourly coverage and aligns with the 2-hour-wide query windows defined in the Edge Function (which tolerate a missed run).
- The `net.http_post` call sends a minimal JSON body (e.g., `{"source": "cron"}`) to identify the invocation source in logs.
- To unschedule: `SELECT cron.unschedule('send-appointment-reminders');`
- **Local development note:** `pg_cron` requires the `cron` extension which is available in hosted Supabase but may need manual setup locally. For local testing, invoke the function manually via `curl`. Document this limitation.

**Acceptance Criteria:**
- [ ] Migration file `00020_create_appointment_reminder_cron.sql` applies without error
- [ ] `pg_cron` and `pg_net` extensions are enabled
- [ ] Cron job `send-appointment-reminders` appears in `cron.job` table
- [ ] Job is scheduled for `0 * * * *` (every hour)
- [ ] Job invokes the Edge Function URL via `net.http_post`
- [ ] Migration comments document the requirement to update Vault secrets for production
- [ ] Instructions for verifying the cron job are included as SQL comments

**Estimated Effort:** M (Medium)

**Dependencies:** PHASE-3-A (Edge Function must be deployed for the cron job to have a target)

---

### PHASE-4-B: Production Deployment Checklist

**Objective:** Document the deployment steps required to activate the reminder system in production.

**Contract/Interface:**

A checklist section in this spec (not a separate file) covering:
1. Resend account setup
2. Domain verification
3. API key configuration
4. Edge Function deployment
5. Vault secrets for cron job
6. Verification steps

**Files:**
- **Modify:** This spec document (add deployment section) -- OR -- create `supabase/functions/appointment-reminders/README.md`

**Key Considerations:**
- Resend requires domain verification before sending from a custom domain
- The free tier limit of 3,000 emails/month should be documented
- Edge Function deployment: `supabase functions deploy appointment-reminders`
- Secrets: `supabase secrets set RESEND_API_KEY=re_xxxxx`
- Vault secrets for cron: must be set via SQL editor after deployment
- Verification: manually trigger the function and check Resend dashboard for delivery

**Acceptance Criteria:**
- [ ] Deployment checklist is documented
- [ ] Resend setup steps are included
- [ ] Vault secret configuration is documented
- [ ] Verification steps are included
- [ ] Free tier limits are documented

**Estimated Effort:** S (Small)

**Dependencies:** PHASE-4-A

---

## 5. Cross-Cutting Concerns

### Error Handling Strategy

- **Resend API failure:** Log the error with `console.error` including the appointment ID and error details. Do NOT mark the reminder as sent. The next hourly run will retry automatically.
- **Database query failure:** Return a 500 response with error details. The cron job will fire again next hour.
- **Partial failure:** If some emails send and others fail, the successful ones are marked as sent. Failed ones will be retried on the next run. This is the natural behavior of the idempotency flag pattern.
- **Edge Function timeout:** If processing takes too long, Supabase will kill the function. Already-sent reminders (flags updated) will not be re-sent. Unsent reminders will be retried next hour.

### Idempotency Guarantees

- Each appointment has independent boolean flags for each interval.
- The flag is updated to `TRUE` only AFTER a successful Resend API response.
- The query filters for `reminder_Xh_sent = FALSE`, so already-sent reminders are never re-queried.
- Race condition risk is minimal: the cron job runs hourly, and each run processes sequentially. Two simultaneous runs are unlikely, and even if they occur, the worst case is a duplicate email (acceptable for V1).

### Multi-Tenant Considerations

- The Edge Function uses the service role key, bypassing RLS. This is intentional and correct for a background job that must process all tenants.
- Each email includes the correct clinic name from the `tenants` table.
- No tenant-specific configuration is needed. All tenants are processed in a single run.

### Timezone Handling

- All times in the database are `TIMESTAMPTZ` (stored in UTC).
- The Edge Function query uses `NOW()` (UTC) for window calculations.
- Email display formatting converts to a readable format using `Intl.DateTimeFormat` with timezone consideration. The appointment time is displayed as stored (which reflects the original booking timezone via TIMESTAMPTZ).
- **V1 simplification:** Display times in the timezone implied by the stored `TIMESTAMPTZ` value. Since clinics are in Guatemala (CST/UTC-6), this will generally be correct. A future enhancement could add a `timezone` column to `tenants` for explicit timezone formatting.

### Security Considerations

- The `RESEND_API_KEY` is stored as a Supabase secret, never committed to code.
- The service role key is automatically available in Edge Functions and never exposed to clients.
- The Edge Function is invoked by `pg_cron` via `pg_net`, which is an internal Supabase call. The function is not publicly advertised but is technically reachable if someone knows the URL. The `Authorization` header check (anon key) provides basic protection.
- No patient data is logged. Only appointment IDs and error messages are logged.

### Performance Considerations

- The partial index `WHERE status = 'scheduled'` ensures the reminder query only scans active appointments.
- Sequential processing (one email at a time) is intentional to respect Resend rate limits and simplify error handling. For V1 volumes (small clinics), this is more than sufficient.
- The 2-hour-wide query window ensures that a single missed cron run does not cause missed reminders.

---

## 6. Testing Strategy

Per the project's testing standard (`purple/standards/global/testing.md`), there is no automated test framework configured. Testing is manual.

### Manual Testing Checklist

**Database Migration:**
1. Run `supabase db reset` -- migration should apply without errors
2. Verify columns exist: `SELECT reminder_24h_sent, reminder_2h_sent FROM appointments LIMIT 1;`
3. Verify trigger: Insert an appointment, update `scheduled_start`, confirm flags are reset
4. Verify trigger does NOT fire on other field updates

**Email Templates:**
1. Call each template function with sample data
2. Paste the resulting HTML into an email preview tool (e.g., Litmus, or send via Resend test mode)
3. Verify rendering in Gmail web, Outlook web, and Apple Mail
4. Verify all Spanish text is correct and natural
5. Verify date formatting is correct for various sample dates

**Edge Function (Local):**
1. Start local Supabase: `supabase start`
2. Seed a test appointment with `scheduled_start` in the 24h window and a patient with email
3. Serve the function: `supabase functions serve appointment-reminders --env-file supabase/functions/.env.local --no-verify-jwt`
4. Invoke: `curl -X POST http://127.0.0.1:54321/functions/v1/appointment-reminders`
5. Verify the response JSON shows correct counts
6. Verify the appointment's `reminder_24h_sent` is now `TRUE`
7. Invoke again -- verify the appointment is NOT re-processed (idempotency)
8. Repeat for the 2h window

**Cron Job:**
1. After deploying the cron migration, verify: `SELECT * FROM cron.job WHERE jobname = 'send-appointment-reminders';`
2. Check `cron.job_run_details` after the next hour to verify execution
3. Verify the Edge Function was invoked (check Supabase Edge Function logs)

---

## 7. Deployment Plan

### Environment Variables

| Variable | Where | How to Set |
|----------|-------|-----------|
| `RESEND_API_KEY` | Supabase Edge Function secrets | `supabase secrets set RESEND_API_KEY=re_xxxxx` |
| `SUPABASE_URL` | Auto-provided by Supabase | N/A |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-provided by Supabase | N/A |

### Database Migrations

1. `00019_add_appointment_reminder_columns.sql` -- adds columns, index, trigger
2. `00020_create_appointment_reminder_cron.sql` -- sets up cron job

Apply via: `supabase db push`

### Deployment Steps (Ordered)

1. **Run database migrations:** `supabase db push` (applies both migrations)
2. **Set Resend API key:** `supabase secrets set RESEND_API_KEY=re_xxxxx`
3. **Deploy Edge Function:** `supabase functions deploy appointment-reminders`
4. **Update Vault secrets:** Via Supabase SQL Editor, insert the production project URL and anon key into Vault (required for cron job)
5. **Verify cron job:** `SELECT * FROM cron.job WHERE jobname = 'send-appointment-reminders';`
6. **Monitor first run:** Check Edge Function logs after the next hour mark
7. **Verify email delivery:** Check Resend dashboard for sent emails

### Resend Account Setup

1. Create a Resend account at https://resend.com
2. Verify the sending domain (e.g., `midimed.app`)
3. Create an API key with "Send" permission
4. Note the free tier limit: 3,000 emails/month (supports ~1,500 appointments/month)

### Rollback Plan

- **Disable cron job:** `SELECT cron.unschedule('send-appointment-reminders');`
- **Remove Edge Function:** `supabase functions delete appointment-reminders`
- **Database columns are safe to leave:** They are boolean defaults and do not affect existing functionality. Rollback migration is not strictly necessary.

---

## 8. Risks and Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Resend API downtime | Low | Medium -- reminders not sent during outage | Idempotency flags ensure automatic retry on next hourly run. No data loss. |
| Edge Function timeout on large batch | Low (V1 volumes are small) | Medium -- some reminders delayed | Sequential processing with early flag updates means partial progress is saved. Add logging for run duration. |
| Duplicate emails from race condition | Very Low | Low -- patient gets 2 of the same email | Acceptable for V1. The hourly cadence makes simultaneous runs extremely unlikely. |
| Resend free tier limit exceeded | Medium (as user base grows) | High -- emails stop sending | Monitor via Resend dashboard. Upgrade plan when approaching 3,000/month. |
| Domain not verified in Resend | N/A (setup step) | High -- emails rejected | Include domain verification in deployment checklist. |
| pg_cron not available (self-hosted Supabase) | Low | High -- no automated scheduling | Document as a hosted Supabase requirement. For self-hosted, use an external cron service. |
| Appointment rescheduled rapidly | Low | Low -- multiple reminders for same appointment | Trigger resets flags on reschedule. The window-based query prevents sending if the new time is outside the current window. |

### V1 Known Limitations

1. **No cancellation notification:** If an appointment is cancelled after a reminder was sent, no cancellation email is sent. Documented in product spec as out of scope.
2. **No unsubscribe mechanism:** Patients cannot opt out of reminders. Future enhancement.
3. **No admin visibility:** Clinic staff cannot see reminder status in the UI. Future enhancement.
4. **Timezone display:** Appointment times in emails use the stored TIMESTAMPTZ value formatted via `Intl.DateTimeFormat`. This works correctly for Guatemala but may need a per-tenant timezone setting for clinics in other timezones.
5. **Sender domain:** Hardcoded to `noreply@midimed.app`. Multi-tenant custom sender domains are out of scope.

---

## Dependency Graph

```
PHASE-1-A (DB Migration)
    |
    |                    PHASE-2-A (Email Templates)
    |                        |
    +--------+---------------+
             |
         PHASE-3-A (Edge Function)
             |
         PHASE-3-B (Local Testing Setup)
             |
         PHASE-4-A (Cron Configuration)
             |
         PHASE-4-B (Deployment Checklist)
```

**Parallelizable:** PHASE-1-A and PHASE-2-A can be built simultaneously.
**Sequential:** Everything from PHASE-3-A onward depends on Phases 1 and 2.
