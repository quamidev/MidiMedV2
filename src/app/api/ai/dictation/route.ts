/**
 * API Route: AI Dictation Processing
 *
 * Accepts audio recordings, transcribes via OpenAI Whisper,
 * and extracts structured medical record fields via GPT-4o-mini.
 *
 * Created: 2026-02-28 - DICT-002 AI Dictation Feature
 */

import { NextRequest, NextResponse } from 'next/server'
import { experimental_transcribe as transcribe } from 'ai'

import { openai } from '@/lib/ai/config'
import { extractMedicalFields } from '@/lib/ai/dictation-extract'
import type { DictationApiResponse } from '@/types/app'

/** Maximum audio file size (25MB - OpenAI Whisper limit). */
const MAX_AUDIO_SIZE = 25 * 1024 * 1024

/** Supported audio MIME types for transcription. */
const SUPPORTED_MIME_TYPES = [
  'audio/webm',
  'audio/ogg',
  'audio/mp4',
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/mp3',
]

/** Minimum transcript length to consider valid (in characters). */
const MIN_TRANSCRIPT_LENGTH = 5

/**
 * POST /api/ai/dictation
 *
 * Processes voice dictation for medical record field extraction.
 *
 * Request: multipart/form-data
 *   - audio: Audio file (webm, ogg, mp4, mpeg, wav)
 *   - customFieldNames: Optional JSON string array of custom field names
 *
 * Response: DictationApiResponse
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<DictationApiResponse>> {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | null
    const customFieldNamesRaw = formData.get('customFieldNames') as
      | string
      | null

    // Validate audio file presence
    if (!audioFile) {
      return NextResponse.json(
        { success: false, error: 'No se recibio archivo de audio.' },
        { status: 400 }
      )
    }

    // Validate file size
    if (audioFile.size > MAX_AUDIO_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error:
            'El audio es demasiado largo. Intenta con una grabacion mas corta.',
        },
        { status: 400 }
      )
    }

    // Validate MIME type (strip codecs suffix like "audio/webm;codecs=opus")
    const mimeType = audioFile.type.split(';')[0] ?? ''
    if (!SUPPORTED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { success: false, error: 'Formato de audio no soportado.' },
        { status: 400 }
      )
    }

    // Parse custom field names if provided
    let customFieldNames: string[] = []
    if (customFieldNamesRaw) {
      try {
        customFieldNames = JSON.parse(customFieldNamesRaw)
      } catch {
        // Ignore parse errors, proceed without custom fields
      }
    }

    // Step 1: Transcribe audio with Whisper
    const audioBuffer = await audioFile.arrayBuffer()
    const audioData = new Uint8Array(audioBuffer)

    let transcript: string
    try {
      const transcriptionResult = await transcribe({
        model: openai.transcription('whisper-1'),
        audio: audioData,
        providerOptions: {
          openai: {
            language: 'es',
          },
        },
      })

      transcript = transcriptionResult.text
    } catch (error) {
      console.error('Transcription error:', error)
      return NextResponse.json(
        {
          success: false,
          error:
            'Error al transcribir el audio. Por favor intenta de nuevo.',
        },
        { status: 500 }
      )
    }

    // Check for empty/too short transcript
    if (!transcript || transcript.trim().length < MIN_TRANSCRIPT_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          error: 'La grabacion fue muy corta. Intenta de nuevo.',
        },
        { status: 400 }
      )
    }

    // Step 2: Extract structured fields with GPT-4o-mini
    const extractionResult = await extractMedicalFields({
      transcript,
      customFieldNames,
    })

    if (!extractionResult.success) {
      return NextResponse.json(
        { success: false, error: extractionResult.error },
        { status: 500 }
      )
    }

    // Success
    return NextResponse.json({
      success: true,
      data: {
        transcript,
        fields: extractionResult.fields,
      },
    })
  } catch (error) {
    console.error('Dictation API error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor.' },
      { status: 500 }
    )
  }
}
