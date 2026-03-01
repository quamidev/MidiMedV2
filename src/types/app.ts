/**
 * App-Level Type Definitions
 *
 * Contains application-level types for User, Tenant, and related input types.
 * These types are derived from the database schema but tailored for application use.
 *
 * Created: 2026-02-10 - MV2-007 Authentication server actions
 * Updated: 2026-02-10 - MV2-021 Added appointment input/response types
 * Updated: 2026-02-10 - MV2-028 Added medical record input/response types
 * Updated: 2026-02-10 - MV2-035 Added notification types
 * Updated: 2026-03-01 - PHASE-1-A Added reminder_24h_sent and reminder_2h_sent to Appointment
 */

// =============================================================================
// Working Hours Configuration
// =============================================================================

/**
 * Working hours for a single day.
 * Array of [startTime, endTime] in 24-hour format, or null if closed.
 * Example: ["08:00", "17:00"] for 8am-5pm
 */
export type DayWorkingHours = [string, string] | null

/**
 * Weekly working hours configuration.
 * Keys are lowercase 3-letter day abbreviations.
 */
export interface WorkingHours {
  mon: DayWorkingHours
  tue: DayWorkingHours
  wed: DayWorkingHours
  thu: DayWorkingHours
  fri: DayWorkingHours
  sat: DayWorkingHours
  sun: DayWorkingHours
}

/**
 * Custom field definition for medical records.
 * Allows tenants to add custom fields to their medical record forms.
 */
export interface CustomField {
  id: string
  name: string
  type: 'text' | 'number' | 'boolean' | 'select' | 'date'
  options?: string[] // For select type
  required?: boolean
}

// =============================================================================
// User Types
// =============================================================================

/**
 * User role types.
 * - admin: Full access to all features and settings
 * - provider: Medical provider with patient/appointment access
 * - staff: Limited access for administrative tasks
 */
export type UserRole = 'admin' | 'provider' | 'staff'

/**
 * Application user record from the users table.
 * Linked to Supabase Auth via auth_id.
 */
export interface User {
  id: string
  auth_id: string
  tenant_id: string
  email: string
  display_name: string
  role: UserRole
  color: string
  avatar_url: string | null
  invited_by: string | null
  created_at: string
  last_login_at: string
}

/**
 * User with tenant information included.
 * Used when both user and tenant data are needed together.
 */
export interface UserWithTenant extends User {
  tenant: Tenant
}

// =============================================================================
// Tenant Types
// =============================================================================

/**
 * Billing plan types.
 */
export type BillingPlan = 'TRIAL' | 'BASIC' | 'PRO' | 'ENTERPRISE'

/**
 * Billing status types.
 */
export type BillingStatus = 'TRIAL_ACTIVE' | 'TRIAL_EXPIRED' | 'PAID_ACTIVE' | 'PAST_DUE'

/**
 * Tenant/organization record from the tenants table.
 * Represents a medical clinic or practice using MidiMed.
 */
export interface Tenant {
  id: string
  tenant_id: string
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

  // Counters
  total_patients: number
  total_appointments: number
  total_records: number

  // Billing
  billing_plan: BillingPlan
  billing_status: BillingStatus
  trial_start_at: string
  trial_days: number
  purchased_at: string | null
  paid_through: string | null
  provider_subscription_id: string | null
  wants_to_buy: string | null

  // Onboarding
  onboarding_create_patient: boolean
  onboarding_create_appointment: boolean
  onboarding_view_appointment: boolean
  onboarding_complete_appointment: boolean
  onboarding_visit_settings: boolean

  // Timestamps
  created_at: string
  updated_at: string
}

// =============================================================================
// Authentication Input Types
// =============================================================================

/**
 * Input for the signUp server action.
 * Collects all data needed to create a new tenant and admin user.
 */
export interface SignUpInput {
  // Account credentials
  email: string
  password: string

  // User profile
  displayName: string

  // Organization details
  clinicName: string
  phone?: string
  address?: string
  specialties?: string[]
}

/**
 * Input for the signInWithPassword server action.
 */
export interface SignInInput {
  email: string
  password: string
}

/**
 * Input for the sendMagicLink server action.
 */
export interface SendMagicLinkInput {
  email: string
}

/**
 * Input for the acceptInvitation server action.
 * Used when a user is accepting a team invitation.
 */
export interface AcceptInvitationInput {
  email: string
  tempPassword: string
  newPassword: string
  displayName?: string
}

// =============================================================================
// Authentication Response Types
// =============================================================================

/**
 * Standard action result type for server actions.
 * Provides consistent error handling pattern.
 */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Response from signUp action.
 */
export interface SignUpResult {
  user: User
  tenant: Tenant
}

/**
 * Response from signInWithPassword action.
 */
export interface SignInResult {
  user: User
  tenant: Tenant
}

/**
 * Response from acceptInvitation action.
 */
export interface AcceptInvitationResult {
  user: User
  tenant: Tenant
}

// =============================================================================
// Invite Types
// =============================================================================

/**
 * Status of a team invitation.
 */
export type InviteStatus = 'pending' | 'accepted' | 'expired'

/**
 * Team invitation record.
 */
export interface Invite {
  id: string
  tenant_id: string
  email: string
  display_name: string
  role: UserRole
  invited_by: string
  temp_password: string | null
  status: InviteStatus
  created_at: string
  expires_at: string
}

// =============================================================================
// Patient Types
// =============================================================================

/**
 * Biological sex types for patient records.
 */
export type PatientSex = 'M' | 'F' | 'O'

/**
 * Patient record from the patients table.
 */
export interface Patient {
  id: string
  tenant_id: string
  patient_number: number
  first_name: string
  last_name: string
  birth_date: string
  sex: PatientSex

  email: string | null
  phone: string | null
  address: string | null

  allergies: string | null
  notes: string | null
  photo_url: string | null

  summary: string | null

  created_by: string
  latest_appointment_id: string | null

  created_at: string
  updated_at: string
}

/**
 * Appointment status types.
 */
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled'

/**
 * Appointment record from the appointments table.
 */
export interface Appointment {
  id: string
  tenant_id: string
  patient_id: string
  provider_id: string

  scheduled_start: string
  scheduled_end: string

  status: AppointmentStatus
  reason: string | null

  medical_record_id: string | null

  // Reminder tracking
  reminder_24h_sent: boolean
  reminder_2h_sent: boolean

  created_by: string
  created_at: string
  updated_at: string
}

/**
 * Summary PDF metadata structure stored in medical_records.summary_pdf
 */
export interface SummaryPdfMetadata {
  doc_id: string
  storage_path: string
  download_url: string
  created_at: string
}

/**
 * Medical record from the medical_records table.
 */
export interface MedicalRecord {
  id: string
  tenant_id: string
  patient_id: string
  appointment_id: string | null

  summary: string

  // Vital signs
  height_cm: number | null
  weight_kg: number | null
  blood_pressure: string | null
  temperature_c: number | null
  age_at_visit: number | null

  // Clínical documentation
  diagnosis: string | null
  prescribed_medications: string[]
  follow_up_instructions: string | null
  notes: string | null

  // Custom fields
  extras: Record<string, unknown>

  // PDF reference
  summary_pdf: SummaryPdfMetadata | null

  created_by: string
  created_at: string
  updated_at: string
}

/**
 * Patient file record from the patient_files table.
 */
export interface PatientFile {
  id: string
  tenant_id: string
  patient_id: string

  name: string
  storage_path: string
  url: string

  uploaded_by: string
  uploaded_at: string
}

/**
 * Patient with related appointments and medical records.
 * Used for patient detail view.
 */
export interface PatientWithRelations extends Patient {
  appointments: Appointment[]
  medical_records: MedicalRecord[]
}

// =============================================================================
// Patient Input Types
// =============================================================================

/**
 * Input for creating a new patient.
 */
export interface CreatePatientInput {
  name: string // Will be split into first_name/last_name
  birthDate: string
  sex: PatientSex
  email?: string
  phone?: string
  address?: string
  allergies?: string
  notes?: string
}

/**
 * Input for updating an existing patient.
 */
export interface UpdatePatientInput {
  first_name?: string
  last_name?: string
  birth_date?: string
  sex?: PatientSex
  email?: string | null
  phone?: string | null
  address?: string | null
  allergies?: string | null
  notes?: string | null
}

// =============================================================================
// Patient Response Types
// =============================================================================

/**
 * Response from getPatients action.
 */
export interface GetPatientsResult {
  patients: Patient[]
  total: number
}

// =============================================================================
// Appointment Input Types
// =============================================================================

/**
 * Appointment with patient and provider names for display.
 * Used when displaying appointments in calendar, lists, etc.
 */
export interface AppointmentWithRelations extends Appointment {
  patient_name: string
  patient_first_name: string
  patient_last_name: string
  provider_name: string
  provider_color: string
}

/**
 * Input for creating a new appointment.
 */
export interface CreateAppointmentInput {
  patientId: string
  providerId: string
  scheduledStart: string
  scheduledEnd: string
  reason?: string
}

/**
 * Input for updating an existing appointment.
 */
export interface UpdateAppointmentInput {
  scheduledStart?: string
  scheduledEnd?: string
  providerId?: string
  reason?: string
}

/**
 * Input for completing an appointment with medical record data.
 */
export interface CompleteAppointmentInput {
  summary: string
  heightCm?: number
  weightKg?: number
  bloodPressure?: string
  temperatureC?: number
  diagnosis?: string
  prescribedMedications?: string[]
  followUpInstructions?: string
  notes?: string
  extras?: Record<string, unknown>
}

// =============================================================================
// Appointment Response Types
// =============================================================================

/**
 * Result from completing an appointment.
 * Includes both the updated appointment and the created medical record.
 */
export interface CompleteAppointmentResult {
  appointment: Appointment
  medicalRecord: MedicalRecord
}

/**
 * Parameters for getAppointments query.
 */
export interface GetAppointmentsParams {
  startDate: string
  endDate: string
  patientId?: string
  providerId?: string
  /** Filter by multiple patient IDs (OR condition) */
  patientIds?: string[]
  /** Filter by multiple provider IDs (OR condition) */
  providerIds?: string[]
  status?: AppointmentStatus
}

// =============================================================================
// Medical Record Input Types
// =============================================================================

/**
 * Vitals data for a medical record.
 * All fields are optional since not all visits require vital signs.
 */
export interface VitalsInput {
  heightCm?: number
  weightKg?: number
  bloodPressure?: string
  temperatureC?: number
}

/**
 * Input for creating a new medical record.
 * Records are linked to a patient (required) and optionally to an appointment.
 */
export interface CreateMedicalRecordInput {
  patientId: string
  appointmentId?: string
  summary: string
  vitals?: VitalsInput
  diagnosis?: string
  prescribedMedications?: string[]
  followUpInstructions?: string
  notes?: string
  /** Custom fields stored as JSONB for tenant-specific data */
  extras?: Record<string, unknown>
}

/**
 * Input for updating an existing medical record.
 * All fields are optional - only provided fields will be updated.
 */
export interface UpdateMedicalRecordInput {
  summary?: string
  vitals?: VitalsInput
  diagnosis?: string
  prescribedMedications?: string[]
  followUpInstructions?: string
  notes?: string
  /** Custom fields stored as JSONB for tenant-specific data */
  extras?: Record<string, unknown>
}

// =============================================================================
// Medical Record Response Types
// =============================================================================

/**
 * Document metadata for medical record PDFs.
 */
export interface DocumentInfo {
  id: string
  type: string
  storage_path: string
  download_url: string
  created_at: string
}

/**
 * Medical record with related entities included.
 * Used for detail view with patient, appointment, and document data.
 */
export interface MedicalRecordWithRelations extends MedicalRecord {
  patient_name: string
  patient_first_name: string
  patient_last_name: string
  patient_birth_date: string
  appointment_date?: string
  appointment_reason?: string
  document?: DocumentInfo | null
}

// =============================================================================
// Billing Types
// =============================================================================

/**
 * Plan catalog entry from the plan_catalog table.
 */
export interface PlanCatalogEntry {
  id: string
  plan: BillingPlan
  currency: 'GTQ' | 'USD'
  price: number
  active: boolean
  recurrente_product_id: string | null
  recurrente_price_id: string | null
  product_name: string | null
  product_description: string | null
  updated_at: string
}

/**
 * Current plan information for a tenant.
 */
export interface CurrentPlanInfo {
  billing_plan: BillingPlan
  billing_status: BillingStatus
  trial_start_at: string
  trial_days: number
  purchased_at: string | null
  paid_through: string | null
  provider_subscription_id: string | null
}

/**
 * Invoice record from the invoices table.
 */
export interface Invoice {
  id: string
  tenant_id: string
  product: BillingPlan
  amount: number
  currency: 'GTQ' | 'USD'
  period_start: string
  period_end: string
  status: 'pending' | 'paid' | 'failed' | 'cancelled'
  provider: string
  provider_link_id: string | null
  provider_link_url: string | null
  provider_payment_id: string | null
  provider_subscription_id: string | null
  description: string | null
  created_at: string
  due_at: string | null
  paid_at: string | null
}

// =============================================================================
// Notification Types
// =============================================================================

/**
 * Notification type strings.
 * Used to categorize notifications for display and filtering.
 */
export type NotificationType =
  | 'general'
  | 'appointment_created'
  | 'appointment_cancelled'
  | 'appointment_reminder'
  | 'patient_created'
  | 'medical_record_created'
  | 'team_invite'
  | 'billing_alert'

/**
 * Notification metadata structure.
 * Contains entity IDs for deep linking to related resources.
 */
export interface NotificationMetadata {
  appointment_id?: string
  patient_id?: string
  medical_record_id?: string
  invite_id?: string
  invoice_id?: string
  [key: string]: unknown
}

/**
 * Notification record from the notifications table.
 * Notifications are user-specific and support archiving.
 */
export interface Notification {
  id: string
  tenant_id: string
  user_id: string

  title: string
  body: string
  type: NotificationType
  metadata: NotificationMetadata

  is_read: boolean
  archived: boolean

  created_at: string
  expires_at: string | null
}

// =============================================================================
// Notification Input Types
// =============================================================================

/**
 * Parameters for getNotifications query.
 */
export interface GetNotificationsParams {
  /** If true, return archived notifications. If false, return non-archived. If undefined, return all. */
  archived?: boolean
  /** Maximum number of notifications to return. */
  limit?: number
  /** Number of notifications to skip (for págination). */
  offset?: number
}

/**
 * Input for creating a tenant-wide notification.
 * Used internally to notify all users in a tenant.
 */
export interface CreateTenantNotificationInput {
  title: string
  body: string
  type?: NotificationType
  metadata?: NotificationMetadata
  expiresAt?: string
}

// =============================================================================
// Notification Response Types
// =============================================================================

/**
 * Response from getNotifications action.
 */
export interface GetNotificationsResult {
  notifications: Notification[]
  total: number
  unreadCount: number
}
