/**
 * API Route: Patient Summary Generation
 *
 * Internal endpoint that generates an AI-powered clinical summary for a patient.
 * Called asynchronously after medical record creation/update to regenerate
 * the patient's overall summary based on their complete medical history.
 *
 * Updates the patients.summary field with the generated text.
 *
 * Created: 2026-02-10 - MV2-030 AI Patient Summary Generation
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { supabaseAdmin } from '@/lib/supabase/admin'
import { generatePatientSummary } from '@/lib/ai/patient-summary'

/**
 * Request body validation schema.
 */
const requestSchema = z.object({
  patientId: z.string().uuid('ID de paciente invalido'),
})

/**
 * POST /api/ai/patient-summary
 *
 * Regenerates the AI-generated summary for a patient based on their medical history.
 * This is an internal endpoint typically called fire-and-forget after record changes.
 *
 * Request body:
 *   - patientId: UUID of the patient
 *
 * Response:
 *   - 200: Success with updated summary
 *   - 400: Invalid request body
 *   - 404: Patient not found
 *   - 500: AI generation or database error
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validation = requestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Datos invalidos' },
        { status: 400 }
      )
    }

    const { patientId } = validation.data

    // Fetch patient data
    const { data: patient, error: patientError } = await supabaseAdmin
      .from('patients')
      .select('id, allergies, notes')
      .eq('id', patientId)
      .single()

    if (patientError || !patient) {
      console.error('Patient not found for summary generation:', patientId)
      return NextResponse.json(
        { error: 'Paciente no encontrado' },
        { status: 404 }
      )
    }

    // Fetch patient's medical records
    const { data: records, error: recordsError } = await supabaseAdmin
      .from('medical_records')
      .select(
        'created_at, summary, diagnosis, prescribed_medications, follow_up_instructions, height_cm, weight_kg, blood_pressure, temperature_c'
      )
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })

    if (recordsError) {
      console.error('Error fetching medical records:', recordsError)
      return NextResponse.json(
        { error: 'Error al obtener expedientes medicos' },
        { status: 500 }
      )
    }

    // Generate patient summary
    const result = await generatePatientSummary(
      { allergies: patient.allergies, notes: patient.notes },
      records || []
    )

    if (!result.success) {
      console.error('AI summary generation failed:', result.error)
      return NextResponse.json(
        { error: result.error || 'Error al generar resumen' },
        { status: 500 }
      )
    }

    // Update patient summary field
    const { error: updateError } = await supabaseAdmin
      .from('patients')
      .update({
        summary: result.summary,
        updated_at: new Date().toISOString(),
      })
      .eq('id', patientId)

    if (updateError) {
      console.error('Error updating patient summary:', updateError)
      return NextResponse.json(
        { error: 'Error al guardar resumen' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      patientId,
      summary: result.summary,
    })
  } catch (error) {
    console.error('Patient summary API error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
