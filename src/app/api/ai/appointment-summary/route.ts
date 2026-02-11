/**
 * API Route: Appointment SOAP Summary Generation
 *
 * Internal endpoint that generates a structured SOAP summary for an appointment.
 * Called after medical record creation to generate professional documentation.
 * Returns the structured SOAP object for use in PDF generation.
 *
 * Created: 2026-02-10 - MV2-031 AI Appointment SOAP Summary
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  generateAppointmentSummary,
  type SoapSummary,
} from '@/lib/ai/appointment-summary'

/**
 * Request body validation schema.
 */
const requestSchema = z.object({
  recordId: z.string().uuid('ID de expediente inválido'),
})

/**
 * Response type for successful generation.
 */
interface SuccessResponse {
  success: true
  recordId: string
  soap: SoapSummary
}

/**
 * Response type for errors.
 */
interface ErrorResponse {
  success: false
  error: string
}

type ApiResponse = SuccessResponse | ErrorResponse

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
 * POST /api/ai/appointment-summary
 *
 * Generates a SOAP-formatted summary for a medical record/appointment.
 * This is an internal endpoint called after record creation.
 *
 * Request body:
 *   - recordId: UUID of the medical record
 *
 * Response:
 *   - 200: Success with structured SOAP object
 *   - 400: Invalid request body
 *   - 404: Record not found
 *   - 500: AI generation or database error
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validation = requestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0]?.message || 'Datos inválidos',
        },
        { status: 400 }
      )
    }

    const { recordId } = validation.data

    // Fetch medical record with related data
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
      console.error('Record not found for SOAP generation:', recordId)
      return NextResponse.json(
        { success: false, error: 'Expediente médico no encontrado' },
        { status: 404 }
      )
    }

    // Fetch patient data
    const { data: patient, error: patientError } = await supabaseAdmin
      .from('patients')
      .select('first_name, last_name, birth_date, sex')
      .eq('id', record.patient_id)
      .single()

    if (patientError || !patient) {
      console.error('Patient not found:', record.patient_id)
      return NextResponse.json(
        { success: false, error: 'Paciente no encontrado' },
        { status: 404 }
      )
    }

    // Fetch provider (user who created the record)
    const { data: provider, error: providerError } = await supabaseAdmin
      .from('users')
      .select('display_name')
      .eq('id', record.created_by)
      .single()

    if (providerError || !provider) {
      console.error('Provider not found:', record.created_by)
      return NextResponse.json(
        { success: false, error: 'Proveedor no encontrado' },
        { status: 404 }
      )
    }

    // Fetch tenant (clinic)
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('name')
      .eq('tenant_id', record.tenant_id)
      .single()

    if (tenantError || !tenant) {
      console.error('Tenant not found:', record.tenant_id)
      return NextResponse.json(
        { success: false, error: 'Clínica no encontrada' },
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
    const result = await generateAppointmentSummary({
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

    if (!result.success || !result.soap) {
      console.error('SOAP generation failed:', result.error)
      return NextResponse.json(
        { success: false, error: result.error || 'Error al generar SOAP' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      recordId,
      soap: result.soap,
    })
  } catch (error) {
    console.error('Appointment SOAP API error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
