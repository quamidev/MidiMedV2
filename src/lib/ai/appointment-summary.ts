/**
 * AI Appointment SOAP Summary Generation
 *
 * Generates a structured SOAP (Subjective, Objective, Assessment, Plan) summary
 * for medical appointments using GPT-4o-mini via Vercel AI SDK.
 * Uses generateObject for structured output with Zod schema validation.
 *
 * Created: 2026-02-10 - MV2-031 AI Appointment SOAP Summary
 */

import { generateObject } from 'ai'
import { z } from 'zod'

import { model, MAX_RETRIES, RETRY_DELAY_MS, delay } from './config'

/**
 * Zod schema for structured SOAP output.
 * All sections follow Spanish medical documentation conventions.
 */
export const soapSchema = z.object({
  paciente: z.object({
    nombre: z.string().describe('Nombre completo del paciente'),
    edad: z.number().optional().describe('Edad del paciente en anos'),
    sexo: z.string().describe('Sexo del paciente (Masculino/Femenino/Otro)'),
  }),
  doctora: z.string().describe('Nombre del medico/proveedor'),
  clinica: z.string().describe('Nombre de la clinica'),
  visita: z.object({
    fecha: z.string().describe('Fecha de la visita en formato legible'),
    motivo: z.string().describe('Motivo de la consulta'),
    subjetivo: z
      .string()
      .describe('Sintomas y quejas reportadas por el paciente'),
    objetivo: z
      .string()
      .describe('Hallazgos objetivos del examen clinico'),
    evaluacion: z.string().describe('Diagnostico o evaluacion clinica'),
    plan: z.string().describe('Plan de tratamiento'),
  }),
  signosVitales: z.object({
    peso: z.string().optional().describe('Peso del paciente'),
    talla: z.string().optional().describe('Altura del paciente'),
    presionArterial: z.string().optional().describe('Presion arterial'),
    temperatura: z.string().optional().describe('Temperatura corporal'),
  }),
  recetas: z
    .array(z.string())
    .describe('Lista de medicamentos recetados'),
  seguimiento: z
    .string()
    .describe('Instrucciones de seguimiento para el paciente'),
})

/**
 * TypeScript type for SOAP summary output.
 */
export type SoapSummary = z.infer<typeof soapSchema>

/**
 * Input for appointment summary generation.
 */
interface AppointmentSummaryInput {
  patient: {
    firstName: string
    lastName: string
    sex: string
    age?: number
  }
  provider: string
  clinic: string
  appointment: {
    scheduledStart: string
    reason?: string
  }
  record: {
    summary: string
    diagnosis?: string | null
    prescribedMedications?: string[] | null
    followUpInstructions?: string | null
    notes?: string | null
    heightCm?: number | null
    weightKg?: number | null
    bloodPressure?: string | null
    temperatureC?: number | null
  }
}

/**
 * Result of appointment summary generation.
 */
interface GenerateAppointmentSummaryResult {
  success: boolean
  soap?: SoapSummary
  error?: string
}

/**
 * Maps sex code to Spanish display name.
 */
function mapSexToSpanish(sex: string): string {
  switch (sex.toUpperCase()) {
    case 'M':
      return 'Masculino'
    case 'F':
      return 'Femenino'
    case 'O':
      return 'Otro'
    default:
      return sex
  }
}

/**
 * Formats a date string to a readable Spanish format.
 */
function formatDateToSpanish(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-GT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateString
  }
}

/**
 * Generates a structured SOAP summary for an appointment.
 *
 * The summary includes:
 * - Patient information (excluding sensitive demographics)
 * - Provider and clinic details
 * - SOAP format: Subjective, Objective, Assessment, Plan
 * - Vital signs
 * - Prescriptions
 * - Follow-up instructions
 *
 * @param input - Appointment and record data for summary generation
 * @returns Promise resolving to generation result with SOAP object or error
 */
export async function generateAppointmentSummary(
  input: AppointmentSummaryInput
): Promise<GenerateAppointmentSummaryResult> {
  const { patient, provider, clinic, appointment, record } = input

  // Build vital signs context
  const vitalParts: string[] = []
  if (record.heightCm) vitalParts.push(`Talla: ${record.heightCm} cm`)
  if (record.weightKg) vitalParts.push(`Peso: ${record.weightKg} kg`)
  if (record.bloodPressure)
    vitalParts.push(`Presion arterial: ${record.bloodPressure}`)
  if (record.temperatureC)
    vitalParts.push(`Temperatura: ${record.temperatureC}°C`)

  const vitalsContext =
    vitalParts.length > 0 ? vitalParts.join('\n') : 'No registrados'

  const systemPrompt = `Eres un asistente medico. Genera resumenes de consulta en formato SOAP en espanol.
Lenguaje medico profesional. Incluye toda la informacion clinica relevante.
Basate UNICAMENTE en la informacion proporcionada, no inventes datos.
Si una seccion no tiene informacion, indica "No especificado" o "No registrado".`

  const patientSex = mapSexToSpanish(patient.sex)
  const ageText = patient.age ? `${patient.age} anos` : 'edad no registrada'

  const userPrompt = `Genera un resumen SOAP para la siguiente consulta medica:

Paciente: ${patient.firstName} ${patient.lastName}, ${patientSex}, ${ageText}
Doctor/a: ${provider}
Clinica: ${clinic}
Fecha: ${formatDateToSpanish(appointment.scheduledStart)}
Motivo: ${appointment.reason || 'No especificado'}

Notas clinicas:
Resumen: ${record.summary}
${record.diagnosis ? `Diagnostico: ${record.diagnosis}` : ''}
${record.prescribedMedications && record.prescribedMedications.length > 0 ? `Medicamentos: ${record.prescribedMedications.join(', ')}` : ''}
${record.followUpInstructions ? `Seguimiento: ${record.followUpInstructions}` : ''}
${record.notes ? `Notas adicionales: ${record.notes}` : ''}

Signos vitales:
${vitalsContext}`

  // Retry logic
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { object } = await generateObject({
        model,
        schema: soapSchema,
        system: systemPrompt,
        prompt: userPrompt,
      })

      return {
        success: true,
        soap: object,
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.error(
        `Appointment SOAP generation attempt ${attempt}/${MAX_RETRIES} failed:`,
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
    error: lastError?.message || 'Error desconocido al generar resumen SOAP',
  }
}
