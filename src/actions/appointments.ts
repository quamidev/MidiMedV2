'use server'

/**
 * Appointment Server Actions
 *
 * Handles all appointment operations: CRUD, status transitions, and completion with medical records.
 * Uses Supabase for data storage and creates notifications for key events.
 *
 * Created: 2026-02-10 - MV2-021 Appointment server actions
 * Updated: 2026-02-10 - Auto-complete onboarding steps on appointment creation and completion
 * Updated: 2026-03-01 - PHASE-1-A Include reminder_24h_sent and reminder_2h_sent in appointment mappings
 * Updated: 2026-03-02 - AO-002 Added no_show/rescheduled to getAppointments Zod schema
 * Updated: 2026-03-02 - AO-010 Added patient_email to appointment queries and mappings
 * Updated: 2026-03-02 - AO-003 Added markNoShow server action with optional email notification
 * Updated: 2026-03-02 - AO-004 Added rescheduleAppointment, updated reactivateAppointment and overlap checks
 */

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createServerClient } from '@/lib/supabase/server'
import { completeOnboardingStep } from '@/actions/settings'
import type {
  ActionResult,
  Appointment,
  AppointmentStatus,
  AppointmentWithRelations,
  CreateAppointmentInput,
  UpdateAppointmentInput,
  CompleteAppointmentInput,
  CompleteAppointmentResult,
  GetAppointmentsParams,
  MarkNoShowInput,
  RescheduleAppointmentInput,
  RescheduleAppointmentResult,
  MedicalRecord,
} from '@/types/app'

// Note: Types should be imported directly from '@/types/app', not re-exported from server action files

// =============================================================================
// Validation Schemas
// =============================================================================

const getAppointmentsSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Fecha de inicio inválida'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Fecha de fin inválida'),
  patientId: z.string().uuid().optional(),
  providerId: z.string().uuid().optional(),
  patientIds: z.array(z.string().uuid()).optional(),
  providerIds: z.array(z.string().uuid()).optional(),
  status: z.enum(['scheduled', 'completed', 'cancelled', 'no_show', 'rescheduled']).optional(),
})

const createAppointmentSchema = z.object({
  patientId: z.string().uuid('ID de paciente inválido'),
  providerId: z.string().uuid('ID de proveedor inválido'),
  scheduledStart: z.string().min(1, 'Fecha de inicio requerida'),
  scheduledEnd: z.string().min(1, 'Fecha de fin requerida'),
  reason: z.string().optional(),
})

const updateAppointmentSchema = z.object({
  scheduledStart: z.string().optional(),
  scheduledEnd: z.string().optional(),
  providerId: z.string().uuid().optional(),
  reason: z.string().optional(),
})

const completeAppointmentSchema = z.object({
  summary: z.string().min(1, 'El resumen es requerido'),
  heightCm: z.number().positive().optional(),
  weightKg: z.number().positive().optional(),
  bloodPressure: z.string().optional(),
  temperatureC: z.number().optional(),
  diagnosis: z.string().optional(),
  prescribedMedications: z.array(z.string()).optional(),
  followUpInstructions: z.string().optional(),
  notes: z.string().optional(),
  extras: z.record(z.string(), z.unknown()).optional(),
})

const markNoShowSchema = z.object({
  appointmentId: z.string().uuid('ID de cita inválido'),
  sendEmail: z.boolean(),
})

const rescheduleAppointmentSchema = z.object({
  appointmentId: z.string().uuid('ID de cita inválido'),
  newStart: z.string().min(1, 'Fecha de inicio requerida'),
  newEnd: z.string().min(1, 'Fecha de fin requerida'),
})

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Gets the current user and their tenant_id from the authenticated session.
 * Throws an error if not authenticated.
 */
async function getCurrentUserContext() {
  const supabase = await createServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    throw new Error('No autenticado')
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, tenant_id')
    .eq('auth_id', authUser.id)
    .single()

  if (userError || !user) {
    throw new Error('Usuario no encontrado')
  }

  return { supabase, user, tenantId: user.tenant_id as string, userId: user.id as string }
}

/**
 * Calculates age at visit from birth date.
 */
function calculateAgeAtVisit(birthDate: string): number {
  const birth = new Date(birthDate)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const monthDiff = now.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--
  }
  return age
}

/**
 * Creates notifications for all users in a tenant.
 */
async function createTenantNotifications(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  tenantId: string,
  title: string,
  body: string,
  type: string,
  metadata: Record<string, unknown>
) {
  // Get all users in the tenant
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id')
    .eq('tenant_id', tenantId)

  if (usersError || !users) {
    console.error('Error fetching tenant users for notifications:', usersError)
    return
  }

  const now = new Date().toISOString()
  const notifications = users.map(user => ({
    tenant_id: tenantId,
    user_id: user.id,
    title,
    body,
    type,
    metadata,
    is_read: false,
    archived: false,
    created_at: now,
    expires_at: null,
  }))

  const { error: notifError } = await supabase
    .from('notifications')
    .insert(notifications)

  if (notifError) {
    console.error('Error creating notifications:', notifError)
  }
}

// =============================================================================
// Query Actions
// =============================================================================

/**
 * Gets appointments within a date range with optional filters.
 * Returns appointments with patient and provider names.
 *
 * @param params - Query parameters including date range and optional filters
 * @returns ActionResult with appointments including relations
 */
export async function getAppointments(
  params: GetAppointmentsParams
): Promise<ActionResult<AppointmentWithRelations[]>> {
  try {
    const validated = getAppointmentsSchema.parse(params)
    const { startDate, endDate, patientId, providerId, patientIds, providerIds, status } = validated

    const { supabase, tenantId } = await getCurrentUserContext()

    // Build query with patient and provider joins
    let query = supabase
      .from('appointments')
      .select(`
        *,
        patients!inner(first_name, last_name, email),
        users!appointments_provider_id_fkey(display_name, color)
      `)
      .eq('tenant_id', tenantId)
      .gte('scheduled_start', `${startDate}T00:00:00.000Z`)
      .lte('scheduled_start', `${endDate}T23:59:59.999Z`)
      .order('scheduled_start', { ascending: true })

    // Apply optional filters
    // Single ID filters (backwards compatibility)
    if (patientId) {
      query = query.eq('patient_id', patientId)
    }

    if (providerId) {
      query = query.eq('provider_id', providerId)
    }

    // Multiple IDs filters (OR condition)
    if (patientIds && patientIds.length > 0) {
      query = query.in('patient_id', patientIds)
    }

    if (providerIds && providerIds.length > 0) {
      query = query.in('provider_id', providerIds)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: appointments, error } = await query

    if (error) {
      console.error('getAppointments error:', error)
      return { success: false, error: 'Error al obtener citas' }
    }

    // Transform results to include relation names
    const appointmentsWithRelations: AppointmentWithRelations[] = (appointments || []).map((apt) => {
      const patient = apt.patients as { first_name: string; last_name: string; email: string | null } | null
      const provider = apt.users as { display_name: string; color: string } | null

      return {
        id: apt.id,
        tenant_id: apt.tenant_id,
        patient_id: apt.patient_id,
        provider_id: apt.provider_id,
        scheduled_start: apt.scheduled_start,
        scheduled_end: apt.scheduled_end,
        status: apt.status as AppointmentStatus,
        reason: apt.reason,
        medical_record_id: apt.medical_record_id,
        reminder_24h_sent: apt.reminder_24h_sent ?? false,
        reminder_2h_sent: apt.reminder_2h_sent ?? false,
        created_by: apt.created_by,
        created_at: apt.created_at,
        updated_at: apt.updated_at,
        patient_name: patient ? `${patient.first_name} ${patient.last_name}`.trim() : 'Paciente desconocido',
        patient_first_name: patient?.first_name || '',
        patient_last_name: patient?.last_name || '',
        patient_email: patient?.email || null,
        provider_name: provider?.display_name || 'Proveedor desconocido',
        provider_color: provider?.color || '#3abdd4',
      }
    })

    return {
      success: true,
      data: appointmentsWithRelations,
    }
  } catch (error) {
    console.error('getAppointments error:', error)
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError
      return { success: false, error: zodError.issues[0]?.message ?? 'Parámetros inválidos' }
    }
    if (error instanceof Error && error.message === 'No autenticado') {
      return { success: false, error: 'No autenticado' }
    }
    return { success: false, error: 'Error inesperado' }
  }
}

/**
 * Gets a single appointment by ID with patient and provider relations.
 *
 * @param appointmentId - The appointment's UUID
 * @returns ActionResult with appointment including relations
 */
export async function getAppointmentById(
  appointmentId: string
): Promise<ActionResult<AppointmentWithRelations>> {
  try {
    if (!appointmentId) {
      return { success: false, error: 'ID de cita requerido' }
    }

    const { supabase, tenantId } = await getCurrentUserContext()

    const { data: apt, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patients!inner(first_name, last_name, email),
        users!appointments_provider_id_fkey(display_name, color)
      `)
      .eq('id', appointmentId)
      .eq('tenant_id', tenantId)
      .single()

    if (error || !apt) {
      console.error('getAppointmentById error:', error)
      return { success: false, error: 'Cita no encontrada' }
    }

    const patient = apt.patients as { first_name: string; last_name: string; email: string | null } | null
    const provider = apt.users as { display_name: string; color: string } | null

    const appointmentWithRelations: AppointmentWithRelations = {
      id: apt.id,
      tenant_id: apt.tenant_id,
      patient_id: apt.patient_id,
      provider_id: apt.provider_id,
      scheduled_start: apt.scheduled_start,
      scheduled_end: apt.scheduled_end,
      status: apt.status as AppointmentStatus,
      reason: apt.reason,
      medical_record_id: apt.medical_record_id,
      reminder_24h_sent: apt.reminder_24h_sent ?? false,
      reminder_2h_sent: apt.reminder_2h_sent ?? false,
      created_by: apt.created_by,
      created_at: apt.created_at,
      updated_at: apt.updated_at,
      patient_name: patient ? `${patient.first_name} ${patient.last_name}`.trim() : 'Paciente desconocido',
      patient_first_name: patient?.first_name || '',
      patient_last_name: patient?.last_name || '',
      patient_email: patient?.email || null,
      provider_name: provider?.display_name || 'Proveedor desconocido',
      provider_color: provider?.color || '#3abdd4',
    }

    return {
      success: true,
      data: appointmentWithRelations,
    }
  } catch (error) {
    console.error('getAppointmentById error:', error)
    if (error instanceof Error && error.message === 'No autenticado') {
      return { success: false, error: 'No autenticado' }
    }
    return { success: false, error: 'Error inesperado' }
  }
}

// =============================================================================
// CRUD Actions
// =============================================================================

/**
 * Creates a new appointment.
 * Validates that the time slot doesn't overlap with existing appointments.
 * Creates notifications for all tenant users.
 *
 * @param input - Appointment creation data
 * @returns ActionResult with created appointment
 */
export async function createAppointment(
  input: CreateAppointmentInput
): Promise<ActionResult<Appointment>> {
  try {
    const validated = createAppointmentSchema.parse(input)
    const { supabase, tenantId, userId } = await getCurrentUserContext()

    // Validate scheduled times
    const startTime = new Date(validated.scheduledStart)
    const endTime = new Date(validated.scheduledEnd)

    if (startTime >= endTime) {
      return { success: false, error: 'La hora de fin debe ser posterior a la hora de inicio' }
    }

    if (startTime < new Date()) {
      return { success: false, error: 'No se pueden crear citas en el pasado' }
    }

    // Verify patient exists in tenant
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id, first_name, last_name')
      .eq('id', validated.patientId)
      .eq('tenant_id', tenantId)
      .single()

    if (patientError || !patient) {
      return { success: false, error: 'Paciente no encontrado' }
    }

    // Verify provider exists in tenant
    const { data: provider, error: providerError } = await supabase
      .from('users')
      .select('id, display_name')
      .eq('id', validated.providerId)
      .eq('tenant_id', tenantId)
      .single()

    if (providerError || !provider) {
      return { success: false, error: 'Proveedor no encontrado' }
    }

    // Check for overlapping appointments for the same provider
    const { data: overlapping, error: overlapError } = await supabase
      .from('appointments')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('provider_id', validated.providerId)
      .not('status', 'in', '("cancelled","no_show","rescheduled")')
      .or(`and(scheduled_start.lt.${validated.scheduledEnd},scheduled_end.gt.${validated.scheduledStart})`)

    if (overlapError) {
      console.error('Overlap check error:', overlapError)
      return { success: false, error: 'Error al verificar disponibilidad' }
    }

    if (overlapping && overlapping.length > 0) {
      return { success: false, error: 'El proveedor ya tiene una cita en este horario' }
    }

    const now = new Date().toISOString()

    const appointmentData = {
      tenant_id: tenantId,
      patient_id: validated.patientId,
      provider_id: validated.providerId,
      scheduled_start: validated.scheduledStart,
      scheduled_end: validated.scheduledEnd,
      status: 'scheduled' as const,
      reason: validated.reason || null,
      medical_record_id: null,
      created_by: userId,
      created_at: now,
      updated_at: now,
    }

    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert(appointmentData)
      .select()
      .single()

    if (error) {
      console.error('createAppointment error:', error)
      return { success: false, error: 'Error al crear la cita' }
    }

    // Update patient's latest_appointment_id
    await supabase
      .from('patients')
      .update({ latest_appointment_id: appointment.id, updated_at: now })
      .eq('id', validated.patientId)

    // Create notifications for all tenant users
    const patientName = `${patient.first_name} ${patient.last_name}`.trim()
    const appointmentDate = new Date(validated.scheduledStart).toLocaleDateString('es-GT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    await createTenantNotifications(
      supabase,
      tenantId,
      'Nueva cita programada',
      `Cita con ${patientName} para ${appointmentDate}`,
      'appointment_created',
      {
        appointment_id: appointment.id,
        patient_id: validated.patientId,
        provider_id: validated.providerId,
      }
    )

    revalidatePath('/dashboard')
    revalidatePath(`/patients/${validated.patientId}`)

    // Auto-complete onboarding step (fire-and-forget, errors are non-blocking)
    completeOnboardingStep('create_appointment').catch(() => {})

    return {
      success: true,
      data: appointment as Appointment,
    }
  } catch (error) {
    console.error('createAppointment error:', error)
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError
      return { success: false, error: zodError.issues[0]?.message ?? 'Datos inválidos' }
    }
    if (error instanceof Error && error.message === 'No autenticado') {
      return { success: false, error: 'No autenticado' }
    }
    return { success: false, error: 'Error inesperado' }
  }
}

/**
 * Updates an existing appointment (reschedule).
 * Creates notification when appointment is rescheduled.
 *
 * @param appointmentId - The appointment's UUID
 * @param input - Fields to update
 * @returns ActionResult with updated appointment
 */
export async function updateAppointment(
  appointmentId: string,
  input: UpdateAppointmentInput
): Promise<ActionResult<Appointment>> {
  try {
    if (!appointmentId) {
      return { success: false, error: 'ID de cita requerido' }
    }

    const validated = updateAppointmentSchema.parse(input)
    const { supabase, tenantId } = await getCurrentUserContext()

    // Verify appointment exists and belongs to tenant
    const { data: existingAppointment, error: fetchError } = await supabase
      .from('appointments')
      .select('*, patients(first_name, last_name)')
      .eq('id', appointmentId)
      .eq('tenant_id', tenantId)
      .single()

    if (fetchError || !existingAppointment) {
      return { success: false, error: 'Cita no encontrada' }
    }

    // Only allow updates to scheduled appointments
    if (existingAppointment.status !== 'scheduled') {
      return { success: false, error: 'Solo se pueden modificar citas programadas' }
    }

    // Validate times if being updated
    if (validated.scheduledStart || validated.scheduledEnd) {
      const startTime = new Date(validated.scheduledStart || existingAppointment.scheduled_start)
      const endTime = new Date(validated.scheduledEnd || existingAppointment.scheduled_end)

      if (startTime >= endTime) {
        return { success: false, error: 'La hora de fin debe ser posterior a la hora de inicio' }
      }
    }

    // If provider is being changed, verify new provider exists
    if (validated.providerId) {
      const { data: provider, error: providerError } = await supabase
        .from('users')
        .select('id')
        .eq('id', validated.providerId)
        .eq('tenant_id', tenantId)
        .single()

      if (providerError || !provider) {
        return { success: false, error: 'Proveedor no encontrado' }
      }
    }

    // Check for overlapping appointments if time or provider changed
    if (validated.scheduledStart || validated.scheduledEnd || validated.providerId) {
      const checkStart = validated.scheduledStart || existingAppointment.scheduled_start
      const checkEnd = validated.scheduledEnd || existingAppointment.scheduled_end
      const checkProvider = validated.providerId || existingAppointment.provider_id

      const { data: overlapping, error: overlapError } = await supabase
        .from('appointments')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('provider_id', checkProvider)
        .neq('id', appointmentId)
        .not('status', 'in', '("cancelled","no_show","rescheduled")')
        .or(`and(scheduled_start.lt.${checkEnd},scheduled_end.gt.${checkStart})`)

      if (overlapError) {
        console.error('Overlap check error:', overlapError)
        return { success: false, error: 'Error al verificar disponibilidad' }
      }

      if (overlapping && overlapping.length > 0) {
        return { success: false, error: 'El proveedor ya tiene una cita en este horario' }
      }
    }

    const now = new Date().toISOString()
    const updateData: Record<string, unknown> = {
      updated_at: now,
    }

    if (validated.scheduledStart) updateData.scheduled_start = validated.scheduledStart
    if (validated.scheduledEnd) updateData.scheduled_end = validated.scheduledEnd
    if (validated.providerId) updateData.provider_id = validated.providerId
    if (validated.reason !== undefined) updateData.reason = validated.reason || null

    const { data: appointment, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', appointmentId)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) {
      console.error('updateAppointment error:', error)
      return { success: false, error: 'Error al actualizar la cita' }
    }

    // Create reschedule notification if time was changed
    if (validated.scheduledStart || validated.scheduledEnd) {
      const patient = existingAppointment.patients as { first_name: string; last_name: string } | null
      const patientName = patient ? `${patient.first_name} ${patient.last_name}`.trim() : 'Paciente'
      const newDate = new Date(validated.scheduledStart || existingAppointment.scheduled_start)
        .toLocaleDateString('es-GT', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })

      await createTenantNotifications(
        supabase,
        tenantId,
        'Cita reprogramada',
        `La cita con ${patientName} fue reprogramada para ${newDate}`,
        'appointment_rescheduled',
        {
          appointment_id: appointmentId,
          patient_id: existingAppointment.patient_id,
        }
      )
    }

    revalidatePath('/dashboard')
    revalidatePath(`/patients/${existingAppointment.patient_id}`)

    return {
      success: true,
      data: appointment as Appointment,
    }
  } catch (error) {
    console.error('updateAppointment error:', error)
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError
      return { success: false, error: zodError.issues[0]?.message ?? 'Datos inválidos' }
    }
    if (error instanceof Error && error.message === 'No autenticado') {
      return { success: false, error: 'No autenticado' }
    }
    return { success: false, error: 'Error inesperado' }
  }
}

// =============================================================================
// Status Transition Actions
// =============================================================================

/**
 * Cancels an appointment.
 * Changes status from 'scheduled' to 'cancelled'.
 * Creates notification for all tenant users.
 *
 * @param appointmentId - The appointment's UUID
 * @returns ActionResult with cancelled appointment
 */
export async function cancelAppointment(
  appointmentId: string
): Promise<ActionResult<Appointment>> {
  try {
    if (!appointmentId) {
      return { success: false, error: 'ID de cita requerido' }
    }

    const { supabase, tenantId } = await getCurrentUserContext()

    // Verify appointment exists and belongs to tenant
    const { data: existingAppointment, error: fetchError } = await supabase
      .from('appointments')
      .select('*, patients(first_name, last_name)')
      .eq('id', appointmentId)
      .eq('tenant_id', tenantId)
      .single()

    if (fetchError || !existingAppointment) {
      return { success: false, error: 'Cita no encontrada' }
    }

    // Only allow cancelling scheduled appointments
    if (existingAppointment.status !== 'scheduled') {
      return { success: false, error: 'Solo se pueden cancelar citas programadas' }
    }

    const now = new Date().toISOString()

    const { data: appointment, error } = await supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        updated_at: now,
      })
      .eq('id', appointmentId)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) {
      console.error('cancelAppointment error:', error)
      return { success: false, error: 'Error al cancelar la cita' }
    }

    // Create cancellation notification
    const patient = existingAppointment.patients as { first_name: string; last_name: string } | null
    const patientName = patient ? `${patient.first_name} ${patient.last_name}`.trim() : 'Paciente'
    const appointmentDate = new Date(existingAppointment.scheduled_start).toLocaleDateString('es-GT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    await createTenantNotifications(
      supabase,
      tenantId,
      'Cita cancelada',
      `La cita con ${patientName} del ${appointmentDate} fue cancelada`,
      'appointment_cancelled',
      {
        appointment_id: appointmentId,
        patient_id: existingAppointment.patient_id,
      }
    )

    revalidatePath('/dashboard')
    revalidatePath(`/patients/${existingAppointment.patient_id}`)

    return {
      success: true,
      data: appointment as Appointment,
    }
  } catch (error) {
    console.error('cancelAppointment error:', error)
    if (error instanceof Error && error.message === 'No autenticado') {
      return { success: false, error: 'No autenticado' }
    }
    return { success: false, error: 'Error inesperado' }
  }
}

/**
 * Marks an appointment as no-show.
 * Changes status from 'scheduled' to 'no_show'.
 * Optionally sends a notification email to the patient via Resend API.
 * Creates notification for all tenant users.
 *
 * @param input - Contains appointmentId and sendEmail flag
 * @returns ActionResult with updated appointment
 */
export async function markNoShow(
  input: MarkNoShowInput
): Promise<ActionResult<Appointment>> {
  try {
    const validated = markNoShowSchema.parse(input)
    const { supabase, tenantId } = await getCurrentUserContext()

    // Verify appointment exists and belongs to tenant
    const { data: existingAppointment, error: fetchError } = await supabase
      .from('appointments')
      .select('*, patients(first_name, last_name, email)')
      .eq('id', validated.appointmentId)
      .eq('tenant_id', tenantId)
      .single()

    if (fetchError || !existingAppointment) {
      return { success: false, error: 'Cita no encontrada' }
    }

    // Only allow marking scheduled appointments as no-show
    if (existingAppointment.status !== 'scheduled') {
      return { success: false, error: 'Solo se pueden marcar como no show citas programadas' }
    }

    const now = new Date().toISOString()

    const { data: appointment, error } = await supabase
      .from('appointments')
      .update({
        status: 'no_show',
        updated_at: now,
      })
      .eq('id', validated.appointmentId)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) {
      console.error('markNoShow error:', error)
      return { success: false, error: 'Error al marcar la cita como no show' }
    }

    // Send email notification if requested and patient has email
    const patient = existingAppointment.patients as { first_name: string; last_name: string; email: string | null } | null
    if (validated.sendEmail && patient?.email) {
      try {
        const resendApiKey = process.env.RESEND_API_KEY
        if (resendApiKey) {
          // Get tenant name for email
          const { data: tenant } = await supabase
            .from('tenants')
            .select('name')
            .eq('tenant_id', tenantId)
            .single()

          const { buildNoShowEmailHtml, buildNoShowEmailText } = await import('@/lib/email/no-show-email')

          const emailParams = {
            patientName: `${patient.first_name} ${patient.last_name}`.trim(),
            appointmentDate: new Date(existingAppointment.scheduled_start).toLocaleDateString('es-GT', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            appointmentTime: new Date(existingAppointment.scheduled_start).toLocaleTimeString('es-GT', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            clinicName: tenant?.name || 'Tu clínica',
          }

          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'MidiMed <noreply@midimed.com>',
              to: patient.email,
              subject: 'Cita No Atendida - ' + (tenant?.name || 'Tu clínica'),
              html: buildNoShowEmailHtml(emailParams),
              text: buildNoShowEmailText(emailParams),
            }),
          })
        }
      } catch (emailError) {
        // Email failure should not block the status change
        console.error('Failed to send no-show email:', emailError)
      }
    }

    // Create no-show notification
    const patientName = patient ? `${patient.first_name} ${patient.last_name}`.trim() : 'Paciente'
    const appointmentDate = new Date(existingAppointment.scheduled_start).toLocaleDateString('es-GT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    await createTenantNotifications(
      supabase,
      tenantId,
      'Cita marcada como no show',
      `${patientName} no asistió a la cita del ${appointmentDate}`,
      'appointment_no_show',
      {
        appointment_id: validated.appointmentId,
        patient_id: existingAppointment.patient_id,
      }
    )

    revalidatePath('/dashboard')
    revalidatePath(`/patients/${existingAppointment.patient_id}`)

    return {
      success: true,
      data: appointment as Appointment,
    }
  } catch (error) {
    console.error('markNoShow error:', error)
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError
      return { success: false, error: zodError.issues[0]?.message ?? 'Datos inválidos' }
    }
    if (error instanceof Error && error.message === 'No autenticado') {
      return { success: false, error: 'No autenticado' }
    }
    return { success: false, error: 'Error inesperado' }
  }
}

/**
 * Reactivates a cancelled or no-show appointment.
 * Changes status back to 'scheduled'.
 *
 * @param appointmentId - The appointment's UUID
 * @returns ActionResult with reactivated appointment
 */
export async function reactivateAppointment(
  appointmentId: string
): Promise<ActionResult<Appointment>> {
  try {
    if (!appointmentId) {
      return { success: false, error: 'ID de cita requerido' }
    }

    const { supabase, tenantId } = await getCurrentUserContext()

    // Verify appointment exists and belongs to tenant
    const { data: existingAppointment, error: fetchError } = await supabase
      .from('appointments')
      .select('*, patients(first_name, last_name)')
      .eq('id', appointmentId)
      .eq('tenant_id', tenantId)
      .single()

    if (fetchError || !existingAppointment) {
      return { success: false, error: 'Cita no encontrada' }
    }

    // Only allow reactivating cancelled or no-show appointments
    if (existingAppointment.status !== 'cancelled' && existingAppointment.status !== 'no_show') {
      return { success: false, error: 'Solo se pueden reactivar citas canceladas o marcadas como no show' }
    }

    // Check if the time slot is still available
    const { data: overlapping, error: overlapError } = await supabase
      .from('appointments')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('provider_id', existingAppointment.provider_id)
      .neq('id', appointmentId)
      .not('status', 'in', '("cancelled","no_show","rescheduled")')
      .or(`and(scheduled_start.lt.${existingAppointment.scheduled_end},scheduled_end.gt.${existingAppointment.scheduled_start})`)

    if (overlapError) {
      console.error('Overlap check error:', overlapError)
      return { success: false, error: 'Error al verificar disponibilidad' }
    }

    if (overlapping && overlapping.length > 0) {
      return { success: false, error: 'El horario ya no está disponible' }
    }

    const now = new Date().toISOString()

    const { data: appointment, error } = await supabase
      .from('appointments')
      .update({
        status: 'scheduled',
        updated_at: now,
      })
      .eq('id', appointmentId)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) {
      console.error('reactivateAppointment error:', error)
      return { success: false, error: 'Error al reactivar la cita' }
    }

    // Create reactivation notification
    const patient = existingAppointment.patients as { first_name: string; last_name: string } | null
    const patientName = patient ? `${patient.first_name} ${patient.last_name}`.trim() : 'Paciente'
    const appointmentDate = new Date(existingAppointment.scheduled_start).toLocaleDateString('es-GT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    await createTenantNotifications(
      supabase,
      tenantId,
      'Cita reactivada',
      `La cita con ${patientName} para ${appointmentDate} fue reactivada`,
      'appointment_reactivated',
      {
        appointment_id: appointmentId,
        patient_id: existingAppointment.patient_id,
      }
    )

    revalidatePath('/dashboard')
    revalidatePath(`/patients/${existingAppointment.patient_id}`)

    return {
      success: true,
      data: appointment as Appointment,
    }
  } catch (error) {
    console.error('reactivateAppointment error:', error)
    if (error instanceof Error && error.message === 'No autenticado') {
      return { success: false, error: 'No autenticado' }
    }
    return { success: false, error: 'Error inesperado' }
  }
}

// =============================================================================
// Completion Action
// =============================================================================

/**
 * Completes an appointment and creates a linked medical record.
 * Multi-step operation:
 * 1. Validates the appointment can be completed
 * 2. Creates a medical record with visit data
 * 3. Updates the appointment status and links the record
 * 4. Updates patient's latest_appointment_id
 *
 * @param appointmentId - The appointment's UUID
 * @param input - Medical record data for the visit
 * @returns ActionResult with both appointment and medical record
 */
export async function completeAppointment(
  appointmentId: string,
  input: CompleteAppointmentInput
): Promise<ActionResult<CompleteAppointmentResult>> {
  try {
    if (!appointmentId) {
      return { success: false, error: 'ID de cita requerido' }
    }

    const validated = completeAppointmentSchema.parse(input)
    const { supabase, tenantId, userId } = await getCurrentUserContext()

    // Verify appointment exists and belongs to tenant
    const { data: existingAppointment, error: fetchError } = await supabase
      .from('appointments')
      .select('*, patients(id, birth_date, first_name, last_name)')
      .eq('id', appointmentId)
      .eq('tenant_id', tenantId)
      .single()

    if (fetchError || !existingAppointment) {
      return { success: false, error: 'Cita no encontrada' }
    }

    // Only allow completing scheduled appointments
    if (existingAppointment.status !== 'scheduled') {
      return { success: false, error: 'Solo se pueden completar citas programadas' }
    }

    const patient = existingAppointment.patients as { id: string; birth_date: string; first_name: string; last_name: string } | null
    if (!patient) {
      return { success: false, error: 'Paciente no encontrado' }
    }

    const now = new Date().toISOString()
    const ageAtVisit = calculateAgeAtVisit(patient.birth_date)

    // Step 1: Create medical record
    const medicalRecordData = {
      tenant_id: tenantId,
      patient_id: existingAppointment.patient_id,
      appointment_id: appointmentId,
      summary: validated.summary,
      height_cm: validated.heightCm || null,
      weight_kg: validated.weightKg || null,
      blood_pressure: validated.bloodPressure || null,
      temperature_c: validated.temperatureC || null,
      age_at_visit: ageAtVisit,
      diagnosis: validated.diagnosis || null,
      prescribed_medications: validated.prescribedMedications || [],
      follow_up_instructions: validated.followUpInstructions || null,
      notes: validated.notes || null,
      extras: validated.extras || {},
      summary_pdf: null,
      created_by: userId,
      created_at: now,
      updated_at: now,
    }

    const { data: medicalRecord, error: recordError } = await supabase
      .from('medical_records')
      .insert(medicalRecordData)
      .select()
      .single()

    if (recordError || !medicalRecord) {
      console.error('completeAppointment medical record error:', recordError)
      return { success: false, error: 'Error al crear el expediente médico' }
    }

    // Step 2: Update appointment status and link medical record
    const { data: appointment, error: updateError } = await supabase
      .from('appointments')
      .update({
        status: 'completed',
        medical_record_id: medicalRecord.id,
        updated_at: now,
      })
      .eq('id', appointmentId)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (updateError || !appointment) {
      console.error('completeAppointment update error:', updateError)
      // Rollback: delete the medical record
      await supabase.from('medical_records').delete().eq('id', medicalRecord.id)
      return { success: false, error: 'Error al completar la cita' }
    }

    // Step 3: Update patient's latest_appointment_id
    await supabase
      .from('patients')
      .update({
        latest_appointment_id: appointmentId,
        updated_at: now,
      })
      .eq('id', existingAppointment.patient_id)

    // Create completion notification
    const patientName = `${patient.first_name} ${patient.last_name}`.trim()

    await createTenantNotifications(
      supabase,
      tenantId,
      'Cita completada',
      `La cita con ${patientName} fue completada. Se creó un nuevo expediente médico.`,
      'appointment_completed',
      {
        appointment_id: appointmentId,
        patient_id: existingAppointment.patient_id,
        medical_record_id: medicalRecord.id,
      }
    )

    revalidatePath('/dashboard')
    revalidatePath(`/patients/${existingAppointment.patient_id}`)

    // Auto-complete onboarding step (fire-and-forget, errors are non-blocking)
    completeOnboardingStep('complete_appointment').catch(() => {})

    return {
      success: true,
      data: {
        appointment: appointment as Appointment,
        medicalRecord: medicalRecord as MedicalRecord,
      },
    }
  } catch (error) {
    console.error('completeAppointment error:', error)
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError
      return { success: false, error: zodError.issues[0]?.message ?? 'Datos inválidos' }
    }
    if (error instanceof Error && error.message === 'No autenticado') {
      return { success: false, error: 'No autenticado' }
    }
    return { success: false, error: 'Error inesperado' }
  }
}

// =============================================================================
// Reschedule Action
// =============================================================================

/**
 * Reschedules an appointment by marking the original as 'rescheduled' and
 * creating a new appointment with the same patient, provider, and reason
 * but at the new requested time.
 *
 * @param input - Contains appointmentId, newStart, and newEnd
 * @returns ActionResult with both original (rescheduled) and new (scheduled) appointments
 */
export async function rescheduleAppointment(
  input: RescheduleAppointmentInput
): Promise<ActionResult<RescheduleAppointmentResult>> {
  try {
    const validated = rescheduleAppointmentSchema.parse(input)
    const { supabase, tenantId, userId } = await getCurrentUserContext()

    // Verify original appointment exists and belongs to tenant
    const { data: existingAppointment, error: fetchError } = await supabase
      .from('appointments')
      .select('*, patients(first_name, last_name)')
      .eq('id', validated.appointmentId)
      .eq('tenant_id', tenantId)
      .single()

    if (fetchError || !existingAppointment) {
      return { success: false, error: 'Cita no encontrada' }
    }

    // Only allow rescheduling scheduled appointments
    if (existingAppointment.status !== 'scheduled') {
      return { success: false, error: 'Solo se pueden reprogramar citas programadas' }
    }

    // Validate new times
    const newStartTime = new Date(validated.newStart)
    const newEndTime = new Date(validated.newEnd)

    if (newEndTime <= newStartTime) {
      return { success: false, error: 'La hora de fin debe ser posterior a la hora de inicio' }
    }

    // Check for overlaps at the new time (excluding cancelled, no_show, rescheduled)
    const { data: overlapping, error: overlapError } = await supabase
      .from('appointments')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('provider_id', existingAppointment.provider_id)
      .neq('id', validated.appointmentId)
      .not('status', 'in', '("cancelled","no_show","rescheduled")')
      .or(`and(scheduled_start.lt.${validated.newEnd},scheduled_end.gt.${validated.newStart})`)

    if (overlapError) {
      console.error('Reschedule overlap check error:', overlapError)
      return { success: false, error: 'Error al verificar disponibilidad' }
    }

    if (overlapping && overlapping.length > 0) {
      return { success: false, error: 'El proveedor ya tiene una cita en este horario' }
    }

    const now = new Date().toISOString()

    // Step 1: Mark original appointment as rescheduled
    const { data: originalAppointment, error: updateError } = await supabase
      .from('appointments')
      .update({
        status: 'rescheduled',
        updated_at: now,
      })
      .eq('id', validated.appointmentId)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (updateError || !originalAppointment) {
      console.error('rescheduleAppointment update error:', updateError)
      return { success: false, error: 'Error al reprogramar la cita' }
    }

    // Step 2: Create new appointment with same details but new times
    const newAppointmentData = {
      tenant_id: tenantId,
      patient_id: existingAppointment.patient_id,
      provider_id: existingAppointment.provider_id,
      scheduled_start: validated.newStart,
      scheduled_end: validated.newEnd,
      status: 'scheduled' as const,
      reason: existingAppointment.reason || null,
      medical_record_id: null,
      created_by: userId,
      created_at: now,
      updated_at: now,
    }

    const { data: newAppointment, error: insertError } = await supabase
      .from('appointments')
      .insert(newAppointmentData)
      .select()
      .single()

    if (insertError || !newAppointment) {
      console.error('rescheduleAppointment insert error:', insertError)
      // Rollback: revert original appointment status back to scheduled
      await supabase
        .from('appointments')
        .update({ status: 'scheduled', updated_at: now })
        .eq('id', validated.appointmentId)
        .eq('tenant_id', tenantId)
      return { success: false, error: 'Error al crear la nueva cita reprogramada' }
    }

    // Create reschedule notification
    const patient = existingAppointment.patients as { first_name: string; last_name: string } | null
    const patientName = patient ? `${patient.first_name} ${patient.last_name}`.trim() : 'Paciente'
    const newDate = new Date(validated.newStart).toLocaleDateString('es-GT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    await createTenantNotifications(
      supabase,
      tenantId,
      'Cita reprogramada',
      `La cita con ${patientName} fue reprogramada para ${newDate}`,
      'appointment_rescheduled',
      {
        appointment_id: newAppointment.id,
        patient_id: existingAppointment.patient_id,
      }
    )

    revalidatePath('/dashboard')
    revalidatePath(`/patients/${existingAppointment.patient_id}`)

    return {
      success: true,
      data: {
        originalAppointment: originalAppointment as Appointment,
        newAppointment: newAppointment as Appointment,
      },
    }
  } catch (error) {
    console.error('rescheduleAppointment error:', error)
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError
      return { success: false, error: zodError.issues[0]?.message ?? 'Datos inválidos' }
    }
    if (error instanceof Error && error.message === 'No autenticado') {
      return { success: false, error: 'No autenticado' }
    }
    return { success: false, error: 'Error inesperado' }
  }
}
