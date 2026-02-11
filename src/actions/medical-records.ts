'use server'

/**
 * Medical Record Server Actions
 *
 * Handles all medical record operations: CRUD with patient linkage.
 * Records store clinical data including vitals, diagnosis, medications, and custom fields.
 * Triggers async AI summary regeneration and PDF generation after create/update.
 *
 * Created: 2026-02-10 - MV2-028 Medical record server actions
 */

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createServerClient } from '@/lib/supabase/server'
import type {
  ActionResult,
  MedicalRecord,
  MedicalRecordWithRelations,
  CreateMedicalRecordInput,
  UpdateMedicalRecordInput,
  DocumentInfo,
} from '@/types/app'

// Re-export types for convenience
export type {
  MedicalRecordWithRelations,
  CreateMedicalRecordInput,
  UpdateMedicalRecordInput,
}

// =============================================================================
// Validation Schemas
// =============================================================================

const vitalsSchema = z.object({
  heightCm: z.number().positive('La altura debe ser positiva').optional(),
  weightKg: z.number().positive('El peso debe ser positivo').optional(),
  bloodPressure: z.string().optional(),
  temperatureC: z.number().optional(),
})

const createMedicalRecordSchema = z.object({
  patientId: z.string().uuid('ID de paciente invalido'),
  appointmentId: z.string().uuid('ID de cita invalido').optional(),
  summary: z.string().min(1, 'El resumen es requerido'),
  vitals: vitalsSchema.optional(),
  diagnosis: z.string().optional(),
  prescribedMedications: z.array(z.string()).optional(),
  followUpInstructions: z.string().optional(),
  notes: z.string().optional(),
  extras: z.record(z.string(), z.unknown()).optional(),
})

const updateMedicalRecordSchema = z.object({
  summary: z.string().min(1, 'El resumen es requerido').optional(),
  vitals: vitalsSchema.optional(),
  diagnosis: z.string().optional(),
  prescribedMedications: z.array(z.string()).optional(),
  followUpInstructions: z.string().optional(),
  notes: z.string().optional(),
  extras: z.record(z.string(), z.unknown()).optional(),
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
 * Triggers async AI patient summary regeneration.
 * Fire-and-forget: does not block the response.
 */
async function triggerPatientSummaryRegeneration(patientId: string): Promise<void> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    // Fire-and-forget fetch - do not await the response
    fetch(`${baseUrl}/api/ai/patient-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId }),
    }).catch((err) => {
      console.error('Error triggering patient summary regeneration:', err)
    })
  } catch (error) {
    console.error('Error triggering patient summary regeneration:', error)
  }
}

/**
 * Triggers async PDF generation for a medical record.
 * Fire-and-forget: does not block the response.
 */
async function triggerPdfGeneration(recordId: string): Promise<void> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    // Fire-and-forget fetch - do not await the response
    fetch(`${baseUrl}/api/pdf/medical-record`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recordId }),
    }).catch((err) => {
      console.error('Error triggering PDF generation:', err)
    })
  } catch (error) {
    console.error('Error triggering PDF generation:', error)
  }
}

// =============================================================================
// Query Actions
// =============================================================================

/**
 * Gets all medical records for a patient in reverse chronological order.
 *
 * @param patientId - The patient's UUID
 * @returns ActionResult with array of medical records
 */
export async function getMedicalRecords(
  patientId: string
): Promise<ActionResult<MedicalRecord[]>> {
  try {
    if (!patientId) {
      return { success: false, error: 'ID de paciente requerido' }
    }

    const { supabase, tenantId } = await getCurrentUserContext()

    // Verify patient exists and belongs to tenant
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .eq('id', patientId)
      .eq('tenant_id', tenantId)
      .single()

    if (patientError || !patient) {
      return { success: false, error: 'Paciente no encontrado' }
    }

    const { data: records, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('patient_id', patientId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('getMedicalRecords error:', error)
      return { success: false, error: 'Error al obtener expedientes medicos' }
    }

    return {
      success: true,
      data: (records || []) as MedicalRecord[],
    }
  } catch (error) {
    console.error('getMedicalRecords error:', error)
    if (error instanceof Error && error.message === 'No autenticado') {
      return { success: false, error: 'No autenticado' }
    }
    return { success: false, error: 'Error inesperado' }
  }
}

/**
 * Gets a single medical record by ID with related patient, appointment, and document data.
 *
 * @param recordId - The medical record's UUID
 * @returns ActionResult with medical record including relations
 */
export async function getMedicalRecordById(
  recordId: string
): Promise<ActionResult<MedicalRecordWithRelations>> {
  try {
    if (!recordId) {
      return { success: false, error: 'ID de expediente requerido' }
    }

    const { supabase, tenantId } = await getCurrentUserContext()

    // Fetch medical record with patient relation
    const { data: record, error: recordError } = await supabase
      .from('medical_records')
      .select(`
        *,
        patients!inner(first_name, last_name, birth_date),
        appointments(scheduled_start, reason)
      `)
      .eq('id', recordId)
      .eq('tenant_id', tenantId)
      .single()

    if (recordError || !record) {
      console.error('getMedicalRecordById error:', recordError)
      return { success: false, error: 'Expediente medico no encontrado' }
    }

    // Fetch associated document if exists
    let document: DocumentInfo | null = null
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('id, type, storage_path, download_url, created_at')
      .eq('record_id', recordId)
      .eq('tenant_id', tenantId)
      .single()

    if (!docError && doc) {
      document = doc as DocumentInfo
    }

    const patient = record.patients as { first_name: string; last_name: string; birth_date: string } | null
    const appointment = record.appointments as { scheduled_start: string; reason: string | null } | null

    const recordWithRelations: MedicalRecordWithRelations = {
      id: record.id,
      tenant_id: record.tenant_id,
      patient_id: record.patient_id,
      appointment_id: record.appointment_id,
      summary: record.summary,
      height_cm: record.height_cm,
      weight_kg: record.weight_kg,
      blood_pressure: record.blood_pressure,
      temperature_c: record.temperature_c,
      age_at_visit: record.age_at_visit,
      diagnosis: record.diagnosis,
      prescribed_medications: record.prescribed_medications || [],
      follow_up_instructions: record.follow_up_instructions,
      notes: record.notes,
      extras: record.extras || {},
      summary_pdf: record.summary_pdf,
      created_by: record.created_by,
      created_at: record.created_at,
      updated_at: record.updated_at,
      patient_name: patient ? `${patient.first_name} ${patient.last_name}`.trim() : 'Paciente desconocido',
      patient_first_name: patient?.first_name || '',
      patient_last_name: patient?.last_name || '',
      patient_birth_date: patient?.birth_date || '',
      appointment_date: appointment?.scheduled_start,
      appointment_reason: appointment?.reason || undefined,
      document,
    }

    return {
      success: true,
      data: recordWithRelations,
    }
  } catch (error) {
    console.error('getMedicalRecordById error:', error)
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
 * Creates a new medical record for a patient.
 * Triggers async AI summary regeneration and PDF generation after creation.
 *
 * @param input - Medical record creation data
 * @returns ActionResult with created medical record
 */
export async function createMedicalRecord(
  input: CreateMedicalRecordInput
): Promise<ActionResult<MedicalRecord>> {
  try {
    const validated = createMedicalRecordSchema.parse(input)
    const { supabase, tenantId, userId } = await getCurrentUserContext()

    // Verify patient exists and belongs to tenant
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id, birth_date')
      .eq('id', validated.patientId)
      .eq('tenant_id', tenantId)
      .single()

    if (patientError || !patient) {
      return { success: false, error: 'Paciente no encontrado' }
    }

    // If appointment is provided, verify it exists and belongs to tenant
    if (validated.appointmentId) {
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .select('id, patient_id')
        .eq('id', validated.appointmentId)
        .eq('tenant_id', tenantId)
        .single()

      if (appointmentError || !appointment) {
        return { success: false, error: 'Cita no encontrada' }
      }

      // Verify appointment belongs to the same patient
      if (appointment.patient_id !== validated.patientId) {
        return { success: false, error: 'La cita no corresponde al paciente' }
      }
    }

    const now = new Date().toISOString()
    const ageAtVisit = calculateAgeAtVisit(patient.birth_date)

    const recordData = {
      tenant_id: tenantId,
      patient_id: validated.patientId,
      appointment_id: validated.appointmentId || null,
      summary: validated.summary,
      height_cm: validated.vitals?.heightCm || null,
      weight_kg: validated.vitals?.weightKg || null,
      blood_pressure: validated.vitals?.bloodPressure || null,
      temperature_c: validated.vitals?.temperatureC || null,
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

    const { data: record, error } = await supabase
      .from('medical_records')
      .insert(recordData)
      .select()
      .single()

    if (error || !record) {
      console.error('createMedicalRecord error:', error)
      return { success: false, error: 'Error al crear el expediente medico' }
    }

    // Fire-and-forget: Trigger async AI summary regeneration and PDF generation
    triggerPatientSummaryRegeneration(validated.patientId)
    triggerPdfGeneration(record.id)

    revalidatePath(`/patients/${validated.patientId}`)
    revalidatePath('/dashboard')

    return {
      success: true,
      data: record as MedicalRecord,
    }
  } catch (error) {
    console.error('createMedicalRecord error:', error)
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError
      return { success: false, error: zodError.issues[0]?.message ?? 'Datos invalidos' }
    }
    if (error instanceof Error && error.message === 'No autenticado') {
      return { success: false, error: 'No autenticado' }
    }
    return { success: false, error: 'Error inesperado' }
  }
}

/**
 * Updates an existing medical record.
 * Triggers async AI summary regeneration after update.
 *
 * @param recordId - The medical record's UUID
 * @param input - Fields to update
 * @returns ActionResult with updated medical record
 */
export async function updateMedicalRecord(
  recordId: string,
  input: UpdateMedicalRecordInput
): Promise<ActionResult<MedicalRecord>> {
  try {
    if (!recordId) {
      return { success: false, error: 'ID de expediente requerido' }
    }

    const validated = updateMedicalRecordSchema.parse(input)
    const { supabase, tenantId } = await getCurrentUserContext()

    // Verify record exists and belongs to tenant
    const { data: existingRecord, error: fetchError } = await supabase
      .from('medical_records')
      .select('id, patient_id')
      .eq('id', recordId)
      .eq('tenant_id', tenantId)
      .single()

    if (fetchError || !existingRecord) {
      return { success: false, error: 'Expediente medico no encontrado' }
    }

    const now = new Date().toISOString()
    const updateData: Record<string, unknown> = {
      updated_at: now,
    }

    // Only include fields that are provided
    if (validated.summary !== undefined) updateData.summary = validated.summary
    if (validated.diagnosis !== undefined) updateData.diagnosis = validated.diagnosis || null
    if (validated.prescribedMedications !== undefined) updateData.prescribed_medications = validated.prescribedMedications
    if (validated.followUpInstructions !== undefined) updateData.follow_up_instructions = validated.followUpInstructions || null
    if (validated.notes !== undefined) updateData.notes = validated.notes || null
    if (validated.extras !== undefined) updateData.extras = validated.extras

    // Handle vitals separately
    if (validated.vitals) {
      if (validated.vitals.heightCm !== undefined) updateData.height_cm = validated.vitals.heightCm || null
      if (validated.vitals.weightKg !== undefined) updateData.weight_kg = validated.vitals.weightKg || null
      if (validated.vitals.bloodPressure !== undefined) updateData.blood_pressure = validated.vitals.bloodPressure || null
      if (validated.vitals.temperatureC !== undefined) updateData.temperature_c = validated.vitals.temperatureC || null
    }

    const { data: record, error } = await supabase
      .from('medical_records')
      .update(updateData)
      .eq('id', recordId)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error || !record) {
      console.error('updateMedicalRecord error:', error)
      return { success: false, error: 'Error al actualizar el expediente medico' }
    }

    // Fire-and-forget: Trigger async AI summary regeneration
    triggerPatientSummaryRegeneration(existingRecord.patient_id)

    revalidatePath(`/patients/${existingRecord.patient_id}`)
    revalidatePath('/dashboard')

    return {
      success: true,
      data: record as MedicalRecord,
    }
  } catch (error) {
    console.error('updateMedicalRecord error:', error)
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError
      return { success: false, error: zodError.issues[0]?.message ?? 'Datos invalidos' }
    }
    if (error instanceof Error && error.message === 'No autenticado') {
      return { success: false, error: 'No autenticado' }
    }
    return { success: false, error: 'Error inesperado' }
  }
}

/**
 * Deletes a medical record and cascades to associated documents.
 * Also unlinks the appointment if one was associated.
 *
 * @param recordId - The medical record's UUID
 * @returns ActionResult indicating success
 */
export async function deleteMedicalRecord(
  recordId: string
): Promise<ActionResult<void>> {
  try {
    if (!recordId) {
      return { success: false, error: 'ID de expediente requerido' }
    }

    const { supabase, tenantId } = await getCurrentUserContext()

    // Verify record exists and belongs to tenant
    const { data: existingRecord, error: fetchError } = await supabase
      .from('medical_records')
      .select('id, patient_id, appointment_id, summary_pdf')
      .eq('id', recordId)
      .eq('tenant_id', tenantId)
      .single()

    if (fetchError || !existingRecord) {
      return { success: false, error: 'Expediente medico no encontrado' }
    }

    // If there's an associated appointment, unlink the medical record
    if (existingRecord.appointment_id) {
      await supabase
        .from('appointments')
        .update({ medical_record_id: null, updated_at: new Date().toISOString() })
        .eq('id', existingRecord.appointment_id)
        .eq('tenant_id', tenantId)
    }

    // Delete associated documents from the database
    const { data: documents } = await supabase
      .from('documents')
      .select('id, storage_path')
      .eq('record_id', recordId)
      .eq('tenant_id', tenantId)

    if (documents && documents.length > 0) {
      // Delete from storage
      const storagePaths = documents.map(d => d.storage_path)
      await supabase.storage.from('medical-records').remove(storagePaths)

      // Delete document records
      await supabase
        .from('documents')
        .delete()
        .eq('record_id', recordId)
        .eq('tenant_id', tenantId)
    }

    // Delete the medical record
    const { error: deleteError } = await supabase
      .from('medical_records')
      .delete()
      .eq('id', recordId)
      .eq('tenant_id', tenantId)

    if (deleteError) {
      console.error('deleteMedicalRecord error:', deleteError)
      return { success: false, error: 'Error al eliminar el expediente medico' }
    }

    // Trigger AI summary regeneration since a record was removed
    triggerPatientSummaryRegeneration(existingRecord.patient_id)

    revalidatePath(`/patients/${existingRecord.patient_id}`)
    revalidatePath('/dashboard')

    return {
      success: true,
      data: undefined,
    }
  } catch (error) {
    console.error('deleteMedicalRecord error:', error)
    if (error instanceof Error && error.message === 'No autenticado') {
      return { success: false, error: 'No autenticado' }
    }
    return { success: false, error: 'Error inesperado' }
  }
}
