/**
 * Zod schemas for AI Dictation field extraction.
 *
 * These schemas are used with Vercel AI SDK's generateText + Output.object()
 * to extract structured medical fields from voice dictation transcripts.
 * The .describe() annotations guide the LLM on what each field expects.
 *
 * Created: 2026-02-28 - DICT-001 AI Dictation Feature
 */

import { z } from 'zod'

/**
 * Schema for extracted vital signs.
 * All fields nullable - LLM returns null if not mentioned.
 */
export const extractedVitalsSchema = z.object({
  heightCm: z
    .number()
    .nullable()
    .describe(
      'Patient height in centimeters. Convert spoken values like "un metro sesenta y cinco" to 165.'
    ),
  weightKg: z
    .number()
    .nullable()
    .describe(
      'Patient weight in kilograms. Convert spoken values like "setenta y dos kilos" to 72.'
    ),
  bloodPressure: z
    .string()
    .nullable()
    .describe(
      'Blood pressure as "systolic/diastolic" string, e.g. "120/80". Extract from phrases like "presion arterial ciento veinte sobre ochenta".'
    ),
  temperatureC: z
    .number()
    .nullable()
    .describe(
      'Body temperature in Celsius. Convert spoken values like "treinta y siete grados" to 37.0.'
    ),
})

/**
 * Schema for all extracted medical record fields.
 * Used by generateText() with Output.object() for structured extraction.
 */
export const extractedMedicalFieldsSchema = z.object({
  summary: z
    .string()
    .nullable()
    .describe(
      'Brief summary of the consultation reason and main findings. Extract from initial statements about why the patient came.'
    ),
  vitals: extractedVitalsSchema
    .nullable()
    .describe(
      'Vital signs mentioned in the dictation. Return null if no vitals were mentioned.'
    ),
  diagnosis: z
    .string()
    .nullable()
    .describe(
      'Medical diagnosis, presumptive or confirmed. Look for phrases like "diagnostico..." or disease names.'
    ),
  medications: z
    .string()
    .nullable()
    .describe(
      'Prescribed medications, one per line separated by newlines. Include dosage and frequency. Look for phrases like "receto...", "le receto...", "recetar...".'
    ),
  followUpInstructions: z
    .string()
    .nullable()
    .describe(
      'Follow-up instructions and next appointment. Look for phrases like "control en...", "proxima cita...", "seguimiento...".'
    ),
  notes: z
    .string()
    .nullable()
    .describe(
      'Additional notes or observations not fitting other fields. Include any unmatched custom field content here.'
    ),
  extras: z
    .record(z.string(), z.string())
    .nullable()
    .describe(
      'Custom tenant fields. Map field names to extracted values. Only populate if custom field names were provided and mentioned in dictation.'
    ),
})

/**
 * Type inferred from the schema, matching ExtractedMedicalFields interface.
 */
export type ExtractedMedicalFieldsFromSchema = z.infer<typeof extractedMedicalFieldsSchema>
