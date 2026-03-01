/**
 * AI Dictation Field Extraction
 *
 * Extracts structured medical record fields from a Spanish transcript
 * using GPT-4o-mini with Zod schema validation via generateObject.
 *
 * Created: 2026-02-28 - DICT-002 AI Dictation Feature
 */

import { generateObject } from 'ai'

import { model } from '@/lib/ai/config'
import { extractedMedicalFieldsSchema } from '@/lib/ai/dictation-schemas'
import type { ExtractedMedicalFields } from '@/types/app'

/**
 * System prompt for medical field extraction.
 * Instructs the model to extract structured data from Spanish dictation.
 */
const EXTRACTION_SYSTEM_PROMPT = `Eres un asistente medico especializado en extraer informacion estructurada de dictados medicos en espanol.

Tu tarea es analizar la transcripcion de un dictado medico y extraer la informacion en campos estructurados.

REGLAS IMPORTANTES:
1. Solo extrae informacion que este EXPLICITAMENTE mencionada en el dictado.
2. Si un campo NO fue mencionado, devuelve null para ese campo.
3. Convierte valores hablados a numericos:
   - "setenta y dos kilos" -> 72
   - "un metro sesenta y cinco" -> 165
   - "treinta y siete grados" -> 37.0
   - "ciento veinte sobre ochenta" -> "120/80"
4. Para medicamentos, incluye dosis y frecuencia en lineas separadas.
5. Busca estas palabras clave:
   - Resumen: inicio del dictado, "el paciente acude por...", "motivo de consulta..."
   - Vitales: "peso", "altura", "presion", "temperatura"
   - Diagnostico: "diagnostico...", nombres de enfermedades
   - Medicamentos: "receto...", "le receto...", "recetar..."
   - Seguimiento: "control en...", "proxima cita...", "seguimiento..."
   - Notas: informacion adicional que no encaja en otros campos

CAMPOS PERSONALIZADOS:
Si se proporcionan nombres de campos personalizados, intenta mapear contenido relevante a esos campos en el objeto "extras".
Si no puedes mapear algo a un campo personalizado, ponlo en "notes".`

/**
 * Options for extracting medical fields from a transcript.
 */
interface ExtractFieldsOptions {
  transcript: string
  customFieldNames?: string[]
}

/**
 * Result of field extraction - discriminated union.
 */
type ExtractFieldsResult =
  | { success: true; fields: ExtractedMedicalFields }
  | { success: false; error: string }

/**
 * Extract structured medical fields from a Spanish transcript.
 *
 * Uses GPT-4o-mini with Zod schema validation to parse dictation
 * transcripts into structured medical record fields.
 */
export async function extractMedicalFields(
  options: ExtractFieldsOptions
): Promise<ExtractFieldsResult> {
  const { transcript, customFieldNames = [] } = options

  try {
    let userPrompt = `Transcripcion del dictado medico:\n\n"${transcript}"`

    if (customFieldNames.length > 0) {
      userPrompt += `\n\nCampos personalizados de la clinica que debes buscar: ${customFieldNames.join(', ')}`
    }

    const result = await generateObject({
      model,
      schema: extractedMedicalFieldsSchema,
      system: EXTRACTION_SYSTEM_PROMPT,
      prompt: userPrompt,
    })

    return {
      success: true,
      fields: result.object as ExtractedMedicalFields,
    }
  } catch (error) {
    console.error('Dictation extraction error:', error)
    return {
      success: false,
      error: 'Error al procesar la dictacion. Por favor intenta de nuevo.',
    }
  }
}
