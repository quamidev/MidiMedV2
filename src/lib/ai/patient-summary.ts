/**
 * AI Patient Summary Generation
 *
 * Generates a concise clinical summary of a patient based on their medical history.
 * Uses GPT-4o-mini via Vercel AI SDK with Spanish professional medical language.
 * Maximum 200 words, excludes demographic data.
 *
 * Created: 2026-02-10 - MV2-030 AI Patient Summary Generation
 */

import { generateText } from 'ai'

import { model, MAX_RETRIES, RETRY_DELAY_MS, delay } from './config'

/**
 * Medical record data structure for patient summary generation.
 */
interface MedicalRecordForSummary {
  created_at: string
  summary: string
  diagnosis?: string | null
  prescribed_medications?: string[] | null
  follow_up_instructions?: string | null
  height_cm?: number | null
  weight_kg?: number | null
  blood_pressure?: string | null
  temperature_c?: number | null
}

/**
 * Patient data structure for summary generation.
 */
interface PatientForSummary {
  allergies?: string | null
  notes?: string | null
}

/**
 * Result of patient summary generation.
 */
interface GeneratePatientSummaryResult {
  success: boolean
  summary?: string
  error?: string
}

/**
 * Generates a clinical summary for a patient based on their medical history.
 *
 * The summary:
 * - Is written in professional Spanish medical language
 * - Maximum 200 words
 * - Focuses on diagnosed conditions, treatments, procedures, patterns over time
 * - Excludes demographic information (name, birth date, sex)
 *
 * @param patient - Patient data with allergies and notes
 * @param records - Array of medical records for the patient
 * @returns Promise resolving to generation result with summary or error
 */
export async function generatePatientSummary(
  patient: PatientForSummary,
  records: MedicalRecordForSummary[]
): Promise<GeneratePatientSummaryResult> {
  // If no records, return a simple message
  if (!records || records.length === 0) {
    return {
      success: true,
      summary: 'Paciente sin historial de consultas registradas.',
    }
  }

  // Build context from medical records
  const recordsContext = records
    .map((r) => {
      const parts: string[] = [
        `Fecha: ${r.created_at}`,
        `Resumen: ${r.summary}`,
      ]

      if (r.diagnosis) {
        parts.push(`Diagnostico: ${r.diagnosis}`)
      }
      if (r.prescribed_medications && r.prescribed_medications.length > 0) {
        parts.push(`Medicamentos: ${r.prescribed_medications.join(', ')}`)
      }
      if (r.follow_up_instructions) {
        parts.push(`Seguimiento: ${r.follow_up_instructions}`)
      }

      return parts.join('\n')
    })
    .join('\n---\n')

  const systemPrompt = `Eres un asistente medico. Genera resumenes clinicos concisos en espanol.
Enfocate en: condiciones diagnosticadas, tratamientos, procedimientos, patrones a lo largo del tiempo.
Excluye datos demograficos (nombre, fecha de nacimiento, sexo).
Maximo 200 palabras. Lenguaje medico profesional. Texto fluido, sin listas.`

  const userPrompt = `Genera un resumen clinico del paciente basado en la siguiente informacion:

Alergias: ${patient.allergies || 'Ninguna reportada'}
Notas generales: ${patient.notes || 'Ninguna'}

Historial de consultas:
${recordsContext}`

  // Retry logic
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { text } = await generateText({
        model,
        system: systemPrompt,
        prompt: userPrompt,
      })

      return {
        success: true,
        summary: text.trim(),
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.error(
        `Patient summary generation attempt ${attempt}/${MAX_RETRIES} failed:`,
        lastError.message
      )

      // Wait before retrying (except on last attempt)
      if (attempt < MAX_RETRIES) {
        await delay(RETRY_DELAY_MS * attempt) // Exponential backoff
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || 'Error desconocido al generar resumen',
  }
}
