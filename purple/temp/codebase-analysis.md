# MidiMed v2 Codebase Analysis

## Project Overview
- **Name**: MidiMed v2
- **Type**: Medical Practice Management SaaS
- **Target Market**: Latin America (Guatemala focus)
- **Language**: Spanish

## Tech Stack

### Frontend
- Next.js 16.1.6 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 4 (OKLCH color system)
- shadcn/ui (new-york variant, Radix primitives)
- Framer Motion for animations
- Lucide React for icons
- React Hook Form + Zod validation
- Sonner for toast notifications

### Backend
- Next.js Server Actions
- Supabase (PostgreSQL + Auth + Storage)
- Row Level Security (RLS) for multi-tenancy
- AI SDK with OpenAI integration

### Payments
- Recurrente (Latin American payment gateway)
- Supports GTQ (Guatemalan Quetzal) and USD

### Infra
- Vercel deployment
- PostHog analytics
- Nodemailer for emails

## Architecture Patterns

### File Structure
```
src/
  actions/       # Server Actions (CRUD operations)
  app/           # Next.js App Router pages
    (protected)/ # Authenticated routes
    (public)/    # Public routes
    api/         # API routes
  components/    # React components
    ui/          # shadcn/ui primitives
    [feature]/   # Feature-specific components
  contexts/      # React Context providers
  hooks/         # Custom React hooks
  lib/           # Utility libraries
  types/         # TypeScript type definitions
```

### Data Model (Multi-tenant)
- tenants: Organizations/clinics (root entity)
- users: Auth users linked to tenants
- patients: Patient records per tenant
- appointments: Scheduled visits
- medical_records: Clinical documentation
- invoices: Billing records
- notifications: User notifications

### Authentication Flow
- Supabase Auth (email/password + magic link)
- Server Actions handle auth operations
- Protected routes via layout guards
- Team invitations with temp passwords
