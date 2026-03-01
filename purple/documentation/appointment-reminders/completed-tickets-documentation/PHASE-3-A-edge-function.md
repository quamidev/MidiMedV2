# PHASE-3-A: Edge Function -- Core Reminder Logic

**Ticket:** PHASE-3-A
**Status:** Completed
**Date:** 2026-03-01
**Implementer:** Claude Opus 4.6

---

## What Was Implemented

Created the Supabase Edge Function at `supabase/functions/appointment-reminders/index.ts` that serves as the core reminder processing engine. The function accepts POST requests (returning 405 for all other methods), queries all appointments eligible for either a 24-hour or 2-hour email reminder in a single query using the Supabase query builder with PostgREST relationship joins across `appointments`, `patients`, `users`, and `tenants`. For each eligible appointment, it builds the appropriate branded HTML email using the template functions from PHASE-2-A, sends it via the Resend API, and only marks the idempotency flag (`reminder_24h_sent` or `reminder_2h_sent`) as `TRUE` after a successful HTTP 200/201 response from Resend. The function processes appointments sequentially to respect Resend rate limits and isolates errors per appointment so that a single failure does not abort the entire run. It returns a JSON summary with `total_eligible`, `sent_24h`, `sent_2h`, and `errors` counts.

## Key Technical Decisions

- **Supabase query builder over raw SQL RPC:** The ticket suggested either `.rpc()` or careful query construction. The query builder approach was chosen because it avoids the need to create a custom database function, works out of the box with PostgREST, and is more portable. The `.or()` filter with PostgREST `and()` syntax combines both the 24h and 2h window conditions into a single query. The `needs_24h` and `needs_2h` boolean flags are computed in application code after fetching the results.
- **PostgREST relationship hints:** The `patients!inner` and `tenants!inner` hints ensure inner joins (excluding orphaned rows). The `provider:users!appointments_provider_id_fkey` hint disambiguates the FK since `appointments` has multiple FKs to `users` (`provider_id` and `created_by`). The `provider:` alias makes the response shape clearer.
- **`response.ok` for success check:** Instead of checking specifically for `status === 200 || status === 201`, the implementation uses `response.ok` which covers the full 200-299 range. This is more resilient to future Resend API changes while still being semantically correct.
- **Module-level Supabase client:** The client is initialized once at module level (outside the handler) for connection reuse across invocations in the Deno runtime, following Supabase Edge Function best practices.
- **30-second performance warning:** A `console.error` warning is logged if the total processing time exceeds 30 seconds, providing early visibility into potential timeout issues before hitting the Edge Function's hard limit.

## Deviations from Spec

- **No raw SQL / RPC approach:** The implementation spec suggested using `.rpc()` for a raw SQL query with computed `needs_24h` / `needs_2h` columns. Instead, the query builder approach was used exclusively, computing the boolean flags in application code. This avoids the need for a custom database function and keeps the deployment simpler (no additional migration required for an RPC wrapper).
- **PostgREST filter on related table email:** The `.not('patients.email', 'is', null)` filter on the joined relation may have varying behavior across PostgREST versions. Combined with `patients!inner`, it reliably excludes patients without an email address.

## Files Created

| File | Purpose |
|------|---------|
| `supabase/functions/appointment-reminders/index.ts` | Edge Function: query eligible appointments, send emails via Resend, update idempotency flags |

## Testing Performed

- Verified that `npm run lint` (ESLint) passes with no new errors (all 4 pre-existing errors and 37 warnings are in unrelated files).
- Verified that `npm run build` (Next.js) has no new regressions (the pre-existing Playwright import error in `purple/documentation/ai-dictation/qa-test.ts` is unrelated).
- Deno is not available in the local environment, so the Edge Function was not type-checked via `deno check`. All Deno-specific APIs used (`Deno.serve`, `Deno.env.get`, `fetch`, `Response`, `Request`) are standard and well-documented in the Supabase Edge Functions documentation.
- Manually reviewed the code against all 11 acceptance criteria from the ticket and confirmed each is addressed.

## Known Limitations

- **Deno type checking not performed locally:** The function uses Deno-specific APIs and `https://esm.sh/` imports which cannot be validated without Deno installed. The code follows documented Supabase Edge Function patterns.
- **PostgREST `.or()` filter complexity:** The combined `and(...)` conditions inside `.or()` use PostgREST string filter syntax. If PostgREST behavior changes, this filter may need adjustment. An alternative would be creating a database view or RPC function to encapsulate the query logic.
- **Timezone display in emails:** As documented in PHASE-2-A, appointment times in emails are formatted using the Deno runtime's local timezone (UTC in production). A per-tenant timezone setting is a future enhancement.
- **Sequential processing:** All appointments are processed one at a time. For V1 volumes this is appropriate but may need parallelization or batching for larger deployments.
