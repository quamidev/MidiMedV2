# API Standard

## Primary Pattern: Server Actions
All mutations use Next.js Server Actions (NOT API routes).

```
┌───────────────────────────────────────────────────────┐
│                    Client Component                   │
│              import { createPatient }                 │
└───────────────────────┬───────────────────────────────┘
                        │ Direct function call
┌───────────────────────▼───────────────────────────────┐
│              Server Action (src/actions/)             │
│   'use server' directive, Zod validation, DB ops     │
└───────────────────────┬───────────────────────────────┘
                        │
┌───────────────────────▼───────────────────────────────┐
│                 Supabase Client                       │
│              (RLS enforced)                           │
└───────────────────────────────────────────────────────┘
```

## API Routes (Exceptions Only)
Used for:
- Webhooks (`src/app/api/webhooks/`)
- PDF generation (`src/app/api/pdf/`)
- AI streaming (`src/app/api/ai/`)

## Response Pattern
All actions return `ActionResult<T>`:
```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }
```

## Error Handling
- Catch Zod errors first
- Return user-friendly Spanish messages
- Log errors with `console.error`

## Pagination Pattern
```typescript
interface PaginatedParams {
  page?: number    // 1-indexed
  limit?: number   // default 20, max 100
  search?: string
}
```

---

## DOs
- Add `'use server'` directive at top of action files
- Validate all inputs with Zod
- Use `revalidatePath()` after mutations
- Return `ActionResult<T>` type

## DON'Ts
- Do NOT create API routes for CRUD operations
- Do NOT expose internal error details to client
- Do NOT skip input validation
- Do NOT use raw fetch for internal data fetching
