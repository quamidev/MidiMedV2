# Tech Stack Overview

## Core Framework
- **Next.js 16** with App Router (NOT Pages Router)
- **React 19** with Server Components
- **TypeScript** with strict mode

## Frontend
- **Tailwind CSS 4** with OKLCH color system
- **shadcn/ui** new-york variant
- **Radix UI** primitives for accessibility
- **Framer Motion** for animations
- **Lucide React** for icons
- **React Hook Form** + **Zod** for form validation
- **Sonner** for toasts

## Backend
- **Supabase** (PostgreSQL, Auth, Storage)
- **Server Actions** for mutations
- **Row Level Security (RLS)** for multi-tenancy

## Payments
- **Recurrente** (Latin American gateway)
- Currencies: GTQ, USD

## AI
- **Vercel AI SDK** with OpenAI provider

## Package Manager
- **Bun** (preferred) or npm

---

## DOs
- Use Server Components by default
- Use Server Actions for all mutations
- Use Supabase client from `@/lib/supabase/server` in server code
- Keep dependencies minimal

## DON'Ts
- Do NOT use Pages Router patterns
- Do NOT use `getServerSideProps` or `getStaticProps`
- Do NOT import from `@supabase/supabase-js` directly - use lib wrappers
- Do NOT add new UI libraries without justification
