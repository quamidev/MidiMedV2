/**
 * API Route: Medical Record PDF Generation
 *
 * Internal endpoint that generates a PDF for a medical record.
 * First generates SOAP summary via AI, then creates PDF and uploads to Supabase Storage.
 * Updates medical_records.summary_pdf and creates a documents record.
 *
 * Created: 2026-02-10 - MV2-032 PDF Generation Service
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { supabaseAdmin } from '@/lib/supabase/admin'
import { generateAppointmentSummary } from '@/lib/ai/appointment-summary'
import {
  generateMedicalRecordPdf,
  generatePdfStoragePath,
} from '@/lib/pdf/medical-record'

/**
 * Request body validation schema.
 */
const requestSchema = z.object({
  recordId: z.string().uuid('ID de expediente inválido'),
})

/**
 * Calculates age from birth date.
 */
function calculateAge(birthDate: string): number {
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
 * POST /api/pdf/medical-record
 *
 * Generates a PDF for a medical record and uploads it to Supabase Storage.
 *
 * Process:
 * 1. Fetch medical record and related data
 * 2. Generate SOAP summary via AI
 * 3. Generate PDF from SOAP data
 * 4. Upload to Supabase Storage
 * 5. Create documents record
 * 6. Update medical_records.summary_pdf
 *
 * Request body:
 *   - recordId: UUID of the medical record
 *
 * Response:
 *   - 200: Success with document info
 *   - 400: Invalid request body
 *   - 404: Record not found
 *   - 500: Generation or upload error
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validation = requestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Datos inválidos' },
        { status: 400 }
      )
    }

    const { recordId } = validation.data

    // Fetch medical record
    const { data: record, error: recordError } = await supabaseAdmin
      .from('medical_records')
      .select(
        `
        id,
        tenant_id,
        patient_id,
        appointment_id,
        summary,
        diagnosis,
        prescribed_medications,
        follow_up_instructions,
        notes,
        height_cm,
        weight_kg,
        blood_pressure,
        temperature_c,
        created_by
      `
      )
      .eq('id', recordId)
      .single()

    if (recordError || !record) {
      console.error('Record not found for PDF generation:', recordId)
      return NextResponse.json(
        { error: 'Expediente médico no encontrado' },
        { status: 404 }
      )
    }

    // Fetch patient data
    const { data: patient, error: patientError } = await supabaseAdmin
      .from('patients')
      .select('id, first_name, last_name, birth_date, sex')
      .eq('id', record.patient_id)
      .single()

    if (patientError || !patient) {
      console.error('Patient not found:', record.patient_id)
      return NextResponse.json(
        { error: 'Paciente no encontrado' },
        { status: 404 }
      )
    }

    // Fetch provider
    const { data: provider, error: providerError } = await supabaseAdmin
      .from('users')
      .select('id, display_name')
      .eq('id', record.created_by)
      .single()

    if (providerError || !provider) {
      console.error('Provider not found:', record.created_by)
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      )
    }

    // Fetch tenant (clinic)
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('name, address, phone, email, logo_url')
      .eq('tenant_id', record.tenant_id)
      .single()

    if (tenantError || !tenant) {
      console.error('Tenant not found:', record.tenant_id)
      return NextResponse.json(
        { error: 'Clínica no encontrada' },
        { status: 404 }
      )
    }

    // Fetch appointment data if exists
    let appointmentData: {
      scheduledStart: string
      reason?: string
    } = {
      scheduledStart: new Date().toISOString(),
      reason: undefined,
    }

    if (record.appointment_id) {
      const { data: appointment } = await supabaseAdmin
        .from('appointments')
        .select('scheduled_start, reason')
        .eq('id', record.appointment_id)
        .single()

      if (appointment) {
        appointmentData = {
          scheduledStart: appointment.scheduled_start,
          reason: appointment.reason || undefined,
        }
      }
    }

    // Calculate patient age
    const age = calculateAge(patient.birth_date)

    // Generate SOAP summary
    const soapResult = await generateAppointmentSummary({
      patient: {
        firstName: patient.first_name,
        lastName: patient.last_name,
        sex: patient.sex,
        age,
      },
      provider: provider.display_name,
      clinic: tenant.name,
      appointment: appointmentData,
      record: {
        summary: record.summary,
        diagnosis: record.diagnosis,
        prescribedMedications: record.prescribed_medications,
        followUpInstructions: record.follow_up_instructions,
        notes: record.notes,
        heightCm: record.height_cm,
        weightKg: record.weight_kg,
        bloodPressure: record.blood_pressure,
        temperatureC: record.temperature_c,
      },
    })

    if (!soapResult.success || !soapResult.soap) {
      console.error('SOAP generation failed:', soapResult.error)
      return NextResponse.json(
        { error: soapResult.error || 'Error al generar resumen SOAP' },
        { status: 500 }
      )
    }

    // Generate PDF
    const pdfBuffer = await generateMedicalRecordPdf({
      soap: soapResult.soap,
      clinic: {
        name: tenant.name,
        address: tenant.address,
        phone: tenant.phone,
        email: tenant.email,
        logoUrl: tenant.logo_url,
      },
      recordId: record.id,
      patientId: patient.id,
    })

    // Generate storage path
    const storagePath = generatePdfStoragePath(
      record.tenant_id,
      patient.id,
      record.id
    )

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('medical-records')
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true, // Replace if exists
      })

    if (uploadError) {
      console.error('PDF upload error:', uploadError)
      return NextResponse.json(
        { error: 'Error al subir PDF' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('medical-records')
      .getPublicUrl(storagePath)

    const downloadUrl = urlData.publicUrl

    // Create documents record
    const { data: document, error: documentError } = await supabaseAdmin
      .from('documents')
      .insert({
        tenant_id: record.tenant_id,
        patient_id: patient.id,
        appointment_id: record.appointment_id,
        record_id: record.id,
        type: 'appointment_summary_v1',
        storage_path: storagePath,
        download_url: downloadUrl,
        size_bytes: pdfBuffer.length,
        created_by: provider.id,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (documentError || !document) {
      console.error('Document record creation error:', documentError)
      // Don't fail - PDF is uploaded, just log the error
    }

    // Update medical_records.summary_pdf
    const summaryPdfMetadata = {
      doc_id: document?.id || null,
      storage_path: storagePath,
      download_url: downloadUrl,
      created_at: new Date().toISOString(),
    }

    const { error: updateError } = await supabaseAdmin
      .from('medical_records')
      .update({
        summary_pdf: summaryPdfMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq('id', recordId)

    if (updateError) {
      console.error('Medical record update error:', updateError)
      // Don't fail - PDF is uploaded and document created
    }

    return NextResponse.json({
      success: true,
      recordId,
      documentId: document?.id,
      storagePath,
      downloadUrl,
      sizeBytes: pdfBuffer.length,
    })
  } catch (error) {
    console.error('PDF generation API error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
