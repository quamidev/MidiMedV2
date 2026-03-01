# Authentication Standard

## Provider
Supabase Auth (email/password + magic link)

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Client (Browser)                  │
└─────────────────────┬───────────────────────────────┘
                      │ HTTP-only cookies
┌─────────────────────▼───────────────────────────────┐
│               Next.js Middleware                    │
│         (src/lib/supabase/middleware.ts)            │
│              Session refresh + RLS                  │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│               Server Actions                        │
│           (src/actions/auth.ts)                     │
│   signUp, signInWithPassword, signOut, etc.         │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│              Supabase Auth                          │
│           (RLS policies apply)                      │
└─────────────────────────────────────────────────────┘
```

## Key Files
- `src/lib/supabase/server.ts` - Server client factory
- `src/lib/supabase/admin.ts` - Admin client (service role)
- `src/lib/supabase/middleware.ts` - Session refresh
- `src/actions/auth.ts` - Auth server actions
- `src/contexts/user-context.tsx` - Client auth state

## User Roles
- `admin` - Full access
- `provider` - Medical provider
- `staff` - Limited administrative

---

## DOs
- Use `createServerClient()` in Server Components/Actions
- Use `supabaseAdmin` only for admin operations (user creation, etc.)
- Validate with Zod before auth operations
- Return `ActionResult<T>` from all auth actions
- Use Spanish error messages

## DON'Ts
- Do NOT expose service role key to client
- Do NOT store sensitive data in JWT claims
- Do NOT skip email validation
- Do NOT use client-side auth checks as sole protection
