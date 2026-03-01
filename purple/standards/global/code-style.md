# Code Style Standard

## TypeScript

### Strict Mode
Always enabled. No `any` types.

### Naming
- **Files**: kebab-case (`patient-list.tsx`)
- **Components**: PascalCase (`PatientList`)
- **Functions**: camelCase (`getPatients`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_FILE_SIZE`)
- **Types/Interfaces**: PascalCase (`PatientWithRelations`)

### Imports Order
1. React/Next.js
2. External libraries
3. Internal aliases (`@/`)
4. Relative imports

### Type Definitions
- Define types in `src/types/app.ts`
- Use interfaces for objects, types for unions
- Export input/result types alongside main types

## File Headers
Every file includes a JSDoc header:
```typescript
/**
 * Brief description
 *
 * Created: YYYY-MM-DD - Ticket/context
 * Updated: YYYY-MM-DD - Change description
 */
```

## Server Actions Pattern
```typescript
'use server'

import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types/app'

const inputSchema = z.object({ /* ... */ })

export async function myAction(input: MyInput): Promise<ActionResult<MyResult>> {
  try {
    const validated = inputSchema.parse(input)
    // ... logic
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message ?? 'Datos invalidos' }
    }
    return { success: false, error: 'Error inesperado' }
  }
}
```

---

## DOs
- Use `cn()` from `@/lib/utils` for class merging
- Use early returns
- Keep functions under 50 lines when possible
- Add JSDoc to exported functions

## DON'Ts
- Do NOT use `console.log` in production (use `console.error` for errors)
- Do NOT use `// @ts-ignore`
- Do NOT nest more than 3 levels deep
- Do NOT create barrel files (index.ts) unless necessary
