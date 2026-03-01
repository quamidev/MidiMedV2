# Database Standard

## Provider
Supabase (PostgreSQL)

## Multi-Tenancy Model

```
┌─────────────────────────────────────────────────────┐
│                     tenants                         │
│  tenant_id (PK slug) │ name │ settings │ billing   │
└──────────┬──────────────────────────────────────────┘
           │ 1:N
┌──────────▼──────────────────────────────────────────┐
│ users │ patients │ appointments │ medical_records  │
│        All have tenant_id FK with CASCADE delete   │
└─────────────────────────────────────────────────────┘
```

## Key Tables
| Table | Purpose |
|-------|---------|
| `tenants` | Organizations/clinics (root) |
| `users` | Auth users linked to tenants |
| `patients` | Patient demographics |
| `appointments` | Scheduled visits |
| `medical_records` | Clinical documentation |
| `invoices` | Billing records |
| `plan_catalog` | Pricing plans |
| `notifications` | User notifications |
| `invites` | Team invitations |
| `patient_files` | Uploaded documents |

## Row Level Security (RLS)
All tables have RLS enabled. Policies enforce tenant isolation:
```sql
-- Example policy
CREATE POLICY "Users can only see own tenant data"
ON patients FOR SELECT
USING (tenant_id = (SELECT tenant_id FROM users WHERE auth_id = auth.uid()));
```

## Migrations
Location: `supabase/migrations/`
Naming: `XXXXX_description.sql` (5-digit prefix)

---

## DOs
- Always include `tenant_id` in WHERE clauses
- Use UUIDs for primary keys (`gen_random_uuid()`)
- Add indexes on `tenant_id` columns
- Use `TIMESTAMPTZ` for timestamps
- Add foreign keys with `ON DELETE CASCADE`

## DON'Ts
- Do NOT bypass RLS with service role client unless necessary
- Do NOT store sensitive data unencrypted
- Do NOT create tables without RLS policies
- Do NOT use raw SQL in application code - use Supabase client
