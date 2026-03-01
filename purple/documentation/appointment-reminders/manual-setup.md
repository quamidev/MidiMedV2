# Manual Setup Required

**Feature:** Email Appointment Reminders
**Date:** 2026-03-01

## Checklist

Use this checklist to complete the manual setup for this feature.

### Supabase Project Requirements
- [ ] Ensure Supabase project is on **Pro plan or higher** (required for `pg_cron`)

### Resend Account Setup
- [ ] Create account at [https://resend.com](https://resend.com)
- [ ] Add and verify sending domain `midimed.app` (requires DNS records: SPF, DKIM, DMARC)
- [ ] Create API key with **Send** permission only
- [ ] Note: Free tier limit is 3,000 emails/month (~1,500 appointments)

### Environment Variables
- [ ] `RESEND_API_KEY` - Set via: `supabase secrets set RESEND_API_KEY=re_xxxxx`

### Vault Secrets (via SQL Editor)
After running migrations, update the Vault secrets with your actual project values:

```sql
UPDATE vault.secrets
SET secret = 'https://YOUR_PROJECT_REF.supabase.co'
WHERE name = 'project_url';

UPDATE vault.secrets
SET secret = 'YOUR_ANON_KEY'
WHERE name = 'anon_key';
```

- [ ] `project_url` - Your Supabase project URL (find in Settings > API)
- [ ] `anon_key` - Your Supabase anon/public key (find in Settings > API)

### Deployment Commands
Run these commands in order:

```bash
# 1. Apply database migrations
supabase db push

# 2. Set Resend API key
supabase secrets set RESEND_API_KEY=re_xxxxx

# 3. Deploy Edge Function
supabase functions deploy appointment-reminders
```

- [ ] Database migrations applied (`00019`, `00020`)
- [ ] Resend API key secret set
- [ ] Edge Function deployed

### Verification
- [ ] Verify cron job exists: `SELECT * FROM cron.job WHERE jobname = 'send-appointment-reminders';`
- [ ] Monitor first hourly run in Edge Function logs
- [ ] Confirm email delivery in Resend dashboard

---

**Reference:** See `supabase/functions/appointment-reminders/README.md` for detailed deployment instructions.
