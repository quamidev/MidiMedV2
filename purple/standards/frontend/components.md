# Components Standard

## Directory Structure

```
src/components/
  ui/              # shadcn/ui primitives (DO NOT MODIFY)
    button.tsx
    input.tsx
    dialog.tsx
    ...
  [feature]/       # Feature-specific components
    appointments/
    patients/
    medical-records/
    billing/
    landing/
    layout/
    ...
```

## Component Organization

### UI Primitives (`/ui`)
- Direct from shadcn/ui (new-york variant)
- Only add custom variants, never modify core
- Import via `@/components/ui/[component]`

### Feature Components
- One feature per folder
- Colocate related components
- Use descriptive kebab-case names

## Component Pattern

```tsx
/**
 * Brief description
 *
 * Created: YYYY-MM-DD - Context
 */

'use client' // Only if needed

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MyComponentProps {
  title: string
  onAction?: () => void
  className?: string
}

export function MyComponent({ title, onAction, className }: MyComponentProps) {
  return (
    <div className={cn('base-styles', className)}>
      {/* content */}
    </div>
  )
}
```

## Client vs Server Components
- Default to Server Components
- Add `'use client'` only when needed:
  - useState, useEffect
  - Event handlers (onClick, etc.)
  - Browser APIs
  - Third-party client libraries

---

## DOs
- Use shadcn/ui components as base
- Pass `className` prop for customization
- Use `cn()` for class merging
- Export named functions (not default)

## DON'Ts
- Do NOT modify `/ui` component internals
- Do NOT create wrapper components unnecessarily
- Do NOT use inline styles
- Do NOT import React (auto-imported in Next.js 16+)
