# Data Models Standard

## Type Definition Location
All types in `src/types/app.ts`

## Core Entities

### Tenant (Organization)
```typescript
interface Tenant {
  id: string              // UUID
  tenant_id: string       // URL-safe slug (PK for relations)
  name: string
  email: string | null
  phone: string | null
  address: string | null
  logo_url: string | null
  specialties: string[]

  // Settings
  appointment_duration_minutes: number
  working_hours: WorkingHours
  extra_fields: CustomField[]

  // Counters (trigger-maintained)
  total_patients: number
  total_appointments: number
  total_records: number

  // Billing
  billing_plan: BillingPlan
  billing_status: BillingStatus
  trial_start_at: string
  trial_days: number

  created_at: string
  updated_at: string
}
```

### User
```typescript
interface User {
  id: string
  auth_id: string        // Links to Supabase Auth
  tenant_id: string
  email: string
  display_name: string
  role: 'admin' | 'provider' | 'staff'
  color: string          // For calendar display
  avatar_url: string | null
}
```

### Patient
```typescript
interface Patient {
  id: string
  tenant_id: string
  patient_number: number  // Display number (SERIAL)
  first_name: string
  last_name: string
  birth_date: string
  sex: 'M' | 'F' | 'O'
  email: string | null
  phone: string | null
  address: string | null
  allergies: string | null
  summary: string | null  // AI-generated
}
```

### Appointment
```typescript
interface Appointment {
  id: string
  tenant_id: string
  patient_id: string
  provider_id: string
  scheduled_start: string
  scheduled_end: string
  status: 'scheduled' | 'completed' | 'cancelled'
  reason: string | null
  medical_record_id: string | null
}
```

### MedicalRecord
```typescript
interface MedicalRecord {
  id: string
  tenant_id: string
  patient_id: string
  appointment_id: string | null
  summary: string

  // Vitals
  height_cm: number | null
  weight_kg: number | null
  blood_pressure: string | null
  temperature_c: number | null

  // Clinical
  diagnosis: string | null
  prescribed_medications: string[]
  follow_up_instructions: string | null
  notes: string | null
  extras: Record<string, unknown>  // Custom fields
}
```

---

## DOs
- Use `tenant_id` as string (slug), not UUID
- Define separate Input types for create/update
- Include `WithRelations` variants for detail views
- Use null for optional fields, not undefined

## DON'Ts
- Do NOT duplicate type definitions
- Do NOT use enums - use union types
- Do NOT store derived data - compute on read
