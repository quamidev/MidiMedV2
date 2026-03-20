/**
 * Chat Assistant Configuration
 *
 * System prompt and helpers for the AI medical assistant chat feature.
 * Provides evidence-based medical reference information for healthcare professionals.
 *
 * Created: 2026-03-13 - CHAT-003 Chat API Route with Streaming
 */

/**
 * System prompt for the medical reference assistant.
 * Instructs the model to behave as a professional medical reference tool,
 * responding bilingually and never providing definitive diagnoses.
 */
export const CHAT_SYSTEM_PROMPT = `Eres un asistente médico de referencia para profesionales de la salud.

REGLAS:
- Proporciona información médica basada en evidencia
- Responde en el mismo idioma que el usuario (español o inglés)
- Nunca proporciones diagnósticos definitivos
- Siempre recomienda consultar con especialistas cuando corresponda
- Reconoce la incertidumbre cuando la información no sea clara
- Para medicamentos, incluye advertencias sobre interacciones y contraindicaciones comunes
- Si la pregunta está fuera del ámbito médico, indica amablemente que solo puedes ayudar con consultas médicas

FORMATO:
- Usa markdown para estructurar respuestas largas (encabezados, listas, negritas)
- Sé conciso pero completo
- Cita fuentes generales cuando sea posible (ej: "según guías de la OMS")`

/**
 * Maximum number of historical messages to include as context for the AI model.
 * Keeps token usage reasonable while providing enough conversational context.
 */
export const MAX_HISTORY_MESSAGES = 20
