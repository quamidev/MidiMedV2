'use server'

/**
 * Patient Server Actions
 *
 * Handles all patient operations: CRUD, search, photo and file management.
 * Uses Supabase for data storage and Supabase Storage for files.
 *
 * Created: 2026-02-10 - MV2-015 Patient server actions
 */

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createServerClient } from '@/lib/supabase/server'
import type {
  ActionResult,
  Patient,
  PatientWithRelations,
  GetPatientsResult,
  CreatePatientInput,
  UpdatePatientInput,
  PatientFile,
  Appointment,
  MedicalRecord,
} from '@/types/app'

// =============================================================================
// Validation Schemas
// =============================================================================

const createPatientSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha de nacimiento inválida'),
  sex: z.enum(['M', 'F', 'O'], { message: 'Sexo inválido' }),
  email: z.string().email('Correo electrónico inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  allergies: z.string().optional(),
  notes: z.string().optional(),
})

const updatePatientSchema = z.object({
  first_name: z.string().min(1, 'El nombre es requerido').optional(),
  last_name: z.string().optional(),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha de nacimiento inválida').optional(),
  sex: z.enum(['M', 'F', 'O'], { message: 'Sexo inválido' }).optional(),
  email: z.string().email('Correo electrónico inválido').nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  allergies: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

const getPatientsSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
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
 * Gets the file extension from a filename.
 */
function getFileExtension(filename: string): string {
  const parts = filename.split('.')
  const lastPart = parts[parts.length - 1]
  return parts.length > 1 && lastPart ? lastPart.toLowerCase() : 'bin'
}

// =============================================================================
// CRUD Actions
// =============================================================================

/**
 * Gets a páginated list of patients with optional search.
 * Search uses PostgreSQL full-text search on first_name, last_name, email, phone.
 *
 * @param params - Pagination and search parameters
 * @returns ActionResult with patients array and total count
 */
export async function getPatients(params: {
  page?: number
  limit?: number
  search?: string
}): Promise<ActionResult<GetPatientsResult>> {
  try {
    const validated = getPatientsSchema.parse(params)
    const { page, limit, search } = validated

    const { supabase, tenantId } = await getCurrentUserContext()

    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('patients')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)

    // Apply full-text search if search term provided
    if (search && search.trim()) {
      // Escape special characters for tsquery
      const sanitizedSearch = search
        .trim()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(Boolean)
        .map(term => `${term}:*`)
        .join(' & ')

      if (sanitizedSearch) {
        query = query.textSearch('first_name, last_name', sanitizedSearch, {
          type: 'websearch',
          config: 'spanish',
        })
      }
    }

    // Apply ordering and págination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: patients, error, count } = await query

    if (error) {
      console.error('getPatients error:', error)
      return { success: false, error: 'Error al obtener pacientes' }
    }

    return {
      success: true,
      data: {
        patients: (patients || []) as Patient[],
        total: count || 0,
      },
    }
  } catch (error) {
    console.error('getPatients error:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Parámetros inválidos' }
    }
    if (error instanceof Error && error.message === 'No autenticado') {
      return { success: false, error: 'No autenticado' }
    }
    return { success: false, error: 'Error inesperado' }
  }
}

/**
 * Gets a single patient by ID with related appointments and medical records.
 *
 * @param patientId - The patient's UUID
 * @returns ActionResult with patient including relations
 */
export async function getPatientById(
  patientId: string
): Promise<ActionResult<PatientWithRelations>> {
  try {
    if (!patientId) {
      return { success: false, error: 'ID de paciente requerido' }
    }

    const { supabase, tenantId } = await getCurrentUserContext()

    // Fetch patient
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .eq('tenant_id', tenantId)
      .single()

    if (patientError || !patient) {
      console.error('getPatientById error:', patientError)
      return { success: false, error: 'Paciente no encontrado' }
    }

    // Fetch appointments for this patient
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', patientId)
      .eq('tenant_id', tenantId)
      .order('scheduled_start', { ascending: false })

    if (appointmentsError) {
      console.error('getPatientById appointments error:', appointmentsError)
    }

    // Fetch medical records for this patient
    const { data: medicalRecords, error: recordsError } = await supabase
      .from('medical_records')
      .select('*')
      .eq('patient_id', patientId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (recordsError) {
      console.error('getPatientById records error:', recordsError)
    }

    const patientWithRelations: PatientWithRelations = {
      ...(patient as Patient),
      appointments: (appointments || []) as Appointment[],
      medical_records: (medicalRecords || []) as MedicalRecord[],
    }

    return {
      success: true,
      data: patientWithRelations,
    }
  } catch (error) {
    console.error('getPatientById error:', error)
    if (error instanceof Error && error.message === 'No autenticado') {
      return { success: false, error: 'No autenticado' }
    }
    return { success: false, error: 'Error inesperado' }
  }
}

/**
 * Creates a new patient.
 * patient_number is auto-generated by PostgreSQL SERIAL.
 * Display format: PAT-{patient_number padded to 6 digits} (e.g., PAT-000001).
 *
 * @param input - Patient creation data
 * @returns ActionResult with created patient
 */
export async function createPatient(
  input: CreatePatientInput
): Promise<ActionResult<Patient>> {
  try {
    const validated = createPatientSchema.parse(input)
    const { supabase, tenantId, userId } = await getCurrentUserContext()

    // Split name into first/last
    const nameParts = validated.name.trim().split(/\s+/)
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    const now = new Date().toISOString()

    const patientData = {
      tenant_id: tenantId,
      first_name: firstName,
      last_name: lastName,
      birth_date: validated.birthDate,
      sex: validated.sex,
      email: validated.email || null,
      phone: validated.phone || null,
      address: validated.address || null,
      allergies: validated.allergies || null,
      notes: validated.notes || null,
      photo_url: null,
      summary: null,
      created_by: userId,
      latest_appointment_id: null,
      created_at: now,
      updated_at: now,
    }

    const { data: patient, error } = await supabase
      .from('patients')
      .insert(patientData)
      .select()
      .single()

    if (error) {
      console.error('createPatient error:', error)
      return { success: false, error: 'Error al crear paciente' }
    }

    revalidatePath('/patients')

    return {
      success: true,
      data: patient as Patient,
    }
  } catch (error) {
    console.error('createPatient error:', error)
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
 * Updates an existing patient.
 *
 * @param patientId - The patient's UUID
 * @param input - Fields to update
 * @returns ActionResult with updated patient
 */
export async function updatePatient(
  patientId: string,
  input: UpdatePatientInput
): Promise<ActionResult<Patient>> {
  try {
    if (!patientId) {
      return { success: false, error: 'ID de paciente requerido' }
    }

    const validated = updatePatientSchema.parse(input)
    const { supabase, tenantId } = await getCurrentUserContext()

    // Verify patient exists and belongs to tenant
    const { data: existingPatient, error: fetchError } = await supabase
      .from('patients')
      .select('id')
      .eq('id', patientId)
      .eq('tenant_id', tenantId)
      .single()

    if (fetchError || !existingPatient) {
      return { success: false, error: 'Paciente no encontrado' }
    }

    const updateData = {
      ...validated,
      updated_at: new Date().toISOString(),
    }

    const { data: patient, error } = await supabase
      .from('patients')
      .update(updateData)
      .eq('id', patientId)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) {
      console.error('updatePatient error:', error)
      return { success: false, error: 'Error al actualizar paciente' }
    }

    revalidatePath('/patients')
    revalidatePath(`/patients/${patientId}`)

    return {
      success: true,
      data: patient as Patient,
    }
  } catch (error) {
    console.error('updatePatient error:', error)
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
// Photo Management Actions
// =============================================================================

/**
 * Uploads a patient photo to Supabase Storage.
 * Replaces any existing photo for the patient.
 * Bucket: patient-photos
 * Path: {tenant_id}/{patient_id}/photo.{ext}
 *
 * @param patientId - The patient's UUID
 * @param formData - FormData containing the 'file' field
 * @returns ActionResult with the public URL of the uploaded photo
 */
export async function uploadPatientPhoto(
  patientId: string,
  formData: FormData
): Promise<ActionResult<string>> {
  try {
    if (!patientId) {
      return { success: false, error: 'ID de paciente requerido' }
    }

    const file = formData.get('file') as File | null
    if (!file) {
      return { success: false, error: 'Archivo no proporcionado' }
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'Tipo de archivo no permitido. Use JPG, PNG, GIF o WebP.' }
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return { success: false, error: 'El archivo es muy grande. Máximo 5MB.' }
    }

    const { supabase, tenantId } = await getCurrentUserContext()

    // Verify patient exists and belongs to tenant
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id, photo_url')
      .eq('id', patientId)
      .eq('tenant_id', tenantId)
      .single()

    if (patientError || !patient) {
      return { success: false, error: 'Paciente no encontrado' }
    }

    // Delete existing photo if present
    if (patient.photo_url) {
      const oldPath = `${tenantId}/${patientId}/photo`
      // Get old extension from URL and attempt delete - errors are ignored
      await supabase.storage.from('patient-photos').remove([`${oldPath}.jpeg`, `${oldPath}.jpg`, `${oldPath}.png`, `${oldPath}.gif`, `${oldPath}.webp`])
    }

    // Get file extension
    const ext = getFileExtension(file.name)
    const storagePath = `${tenantId}/${patientId}/photo.${ext}`

    // Upload to Supabase Storage
    const buffer = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from('patient-photos')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('uploadPatientPhoto storage error:', uploadError)
      return { success: false, error: 'Error al subir la foto' }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('patient-photos')
      .getPublicUrl(storagePath)

    const photoUrl = urlData.publicUrl

    // Update patient record with photo URL
    const { error: updateError } = await supabase
      .from('patients')
      .update({
        photo_url: photoUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', patientId)
      .eq('tenant_id', tenantId)

    if (updateError) {
      console.error('uploadPatientPhoto update error:', updateError)
      // Photo is uploaded but record not updated - still return success with URL
    }

    revalidatePath(`/patients/${patientId}`)

    return {
      success: true,
      data: photoUrl,
    }
  } catch (error) {
    console.error('uploadPatientPhoto error:', error)
    if (error instanceof Error && error.message === 'No autenticado') {
      return { success: false, error: 'No autenticado' }
    }
    return { success: false, error: 'Error inesperado' }
  }
}

/**
 * Deletes a patient's photo from Supabase Storage.
 *
 * @param patientId - The patient's UUID
 * @returns ActionResult indicating success
 */
export async function deletePatientPhoto(
  patientId: string
): Promise<ActionResult<void>> {
  try {
    if (!patientId) {
      return { success: false, error: 'ID de paciente requerido' }
    }

    const { supabase, tenantId } = await getCurrentUserContext()

    // Verify patient exists and belongs to tenant
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id, photo_url')
      .eq('id', patientId)
      .eq('tenant_id', tenantId)
      .single()

    if (patientError || !patient) {
      return { success: false, error: 'Paciente no encontrado' }
    }

    if (!patient.photo_url) {
      return { success: true, data: undefined }
    }

    // Extract the path from the URL
    // URL format: https://{project}.supabase.co/storage/v1/object/public/patient-photos/{path}
    const photoPath = `${tenantId}/${patientId}`

    // Delete all possible photo extensions
    const extensions = ['jpeg', 'jpg', 'png', 'gif', 'webp']
    const pathsToDelete = extensions.map(ext => `${photoPath}/photo.${ext}`)

    const { error: deleteError } = await supabase.storage
      .from('patient-photos')
      .remove(pathsToDelete)

    if (deleteError) {
      console.error('deletePatientPhoto storage error:', deleteError)
      // Continue to update the record even if storage delete fails
    }

    // Update patient record to remove photo_url
    const { error: updateError } = await supabase
      .from('patients')
      .update({
        photo_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', patientId)
      .eq('tenant_id', tenantId)

    if (updateError) {
      console.error('deletePatientPhoto update error:', updateError)
      return { success: false, error: 'Error al actualizar paciente' }
    }

    revalidatePath(`/patients/${patientId}`)

    return {
      success: true,
      data: undefined,
    }
  } catch (error) {
    console.error('deletePatientPhoto error:', error)
    if (error instanceof Error && error.message === 'No autenticado') {
      return { success: false, error: 'No autenticado' }
    }
    return { success: false, error: 'Error inesperado' }
  }
}

// =============================================================================
// File Management Actions
// =============================================================================

/**
 * Uploads multiple files for a patient to Supabase Storage.
 * Bucket: patient-files
 * Path: {tenant_id}/{patient_id}/{file_id}-{filename}
 *
 * @param patientId - The patient's UUID
 * @param formData - FormData containing 'files' field with multiple files
 * @returns ActionResult with array of created PatientFile records
 */
export async function uploadPatientFiles(
  patientId: string,
  formData: FormData
): Promise<ActionResult<PatientFile[]>> {
  try {
    if (!patientId) {
      return { success: false, error: 'ID de paciente requerido' }
    }

    const files = formData.getAll('files') as File[]
    if (!files || files.length === 0) {
      return { success: false, error: 'No se proporcionaron archivos' }
    }

    // Validate file sizes (10MB max per file)
    const maxSize = 10 * 1024 * 1024
    for (const file of files) {
      if (file.size > maxSize) {
        return { success: false, error: `El archivo "${file.name}" es muy grande. Máximo 10MB.` }
      }
    }

    const { supabase, tenantId, userId } = await getCurrentUserContext()

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

    const uploadedFiles: PatientFile[] = []
    const now = new Date().toISOString()

    for (const file of files) {
      // Generate unique file ID
      const fileId = crypto.randomUUID()
      const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const storagePath = `${tenantId}/${patientId}/${fileId}-${sanitizedFilename}`

      // Upload to storage
      const buffer = await file.arrayBuffer()
      const { error: uploadError } = await supabase.storage
        .from('patient-files')
        .upload(storagePath, buffer, {
          contentType: file.type || 'application/octet-stream',
        })

      if (uploadError) {
        console.error('uploadPatientFiles storage error:', uploadError)
        continue // Skip this file but continue with others
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('patient-files')
        .getPublicUrl(storagePath)

      // Create patient_files record
      const fileRecord = {
        tenant_id: tenantId,
        patient_id: patientId,
        name: file.name,
        storage_path: storagePath,
        url: urlData.publicUrl,
        uploaded_by: userId,
        uploaded_at: now,
      }

      const { data: savedFile, error: insertError } = await supabase
        .from('patient_files')
        .insert(fileRecord)
        .select()
        .single()

      if (insertError) {
        console.error('uploadPatientFiles insert error:', insertError)
        // Try to clean up the uploaded file
        await supabase.storage.from('patient-files').remove([storagePath])
        continue
      }

      uploadedFiles.push(savedFile as PatientFile)
    }

    if (uploadedFiles.length === 0) {
      return { success: false, error: 'No se pudo subir ningun archivo' }
    }

    revalidatePath(`/patients/${patientId}`)

    return {
      success: true,
      data: uploadedFiles,
    }
  } catch (error) {
    console.error('uploadPatientFiles error:', error)
    if (error instanceof Error && error.message === 'No autenticado') {
      return { success: false, error: 'No autenticado' }
    }
    return { success: false, error: 'Error inesperado' }
  }
}

/**
 * Deletes a patient file from Supabase Storage and the database.
 *
 * @param fileId - The file record's UUID
 * @returns ActionResult indicating success
 */
export async function deletePatientFile(
  fileId: string
): Promise<ActionResult<void>> {
  try {
    if (!fileId) {
      return { success: false, error: 'ID de archivo requerido' }
    }

    const { supabase, tenantId } = await getCurrentUserContext()

    // Fetch the file record
    const { data: file, error: fileError } = await supabase
      .from('patient_files')
      .select('*')
      .eq('id', fileId)
      .eq('tenant_id', tenantId)
      .single()

    if (fileError || !file) {
      return { success: false, error: 'Archivo no encontrado' }
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('patient-files')
      .remove([file.storage_path])

    if (storageError) {
      console.error('deletePatientFile storage error:', storageError)
      // Continue to delete the record even if storage delete fails
    }

    // Delete the database record
    const { error: deleteError } = await supabase
      .from('patient_files')
      .delete()
      .eq('id', fileId)
      .eq('tenant_id', tenantId)

    if (deleteError) {
      console.error('deletePatientFile delete error:', deleteError)
      return { success: false, error: 'Error al eliminar el archivo' }
    }

    revalidatePath(`/patients/${file.patient_id}`)

    return {
      success: true,
      data: undefined,
    }
  } catch (error) {
    console.error('deletePatientFile error:', error)
    if (error instanceof Error && error.message === 'No autenticado') {
      return { success: false, error: 'No autenticado' }
    }
    return { success: false, error: 'Error inesperado' }
  }
}

/**
 * Gets all files for a patient.
 *
 * @param patientId - The patient's UUID
 * @returns ActionResult with array of PatientFile records
 */
export async function getPatientFiles(
  patientId: string
): Promise<ActionResult<PatientFile[]>> {
  try {
    if (!patientId) {
      return { success: false, error: 'ID de paciente requerido' }
    }

    const { supabase, tenantId } = await getCurrentUserContext()

    const { data: files, error } = await supabase
      .from('patient_files')
      .select('*')
      .eq('patient_id', patientId)
      .eq('tenant_id', tenantId)
      .order('uploaded_at', { ascending: false })

    if (error) {
      console.error('getPatientFiles error:', error)
      return { success: false, error: 'Error al obtener archivos' }
    }

    return {
      success: true,
      data: (files || []) as PatientFile[],
    }
  } catch (error) {
    console.error('getPatientFiles error:', error)
    if (error instanceof Error && error.message === 'No autenticado') {
      return { success: false, error: 'No autenticado' }
    }
    return { success: false, error: 'Error inesperado' }
  }
}
