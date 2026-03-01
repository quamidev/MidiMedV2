/**
 * Voice Dictation Hook
 *
 * Manages audio recording via MediaRecorder API, microphone permissions,
 * and communication with the AI dictation API endpoint.
 * Returns extracted medical fields for form population.
 *
 * Created: 2026-02-28 - DICT-003 Build useDictation Hook
 */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type { DictationApiResponse, ExtractedMedicalFields } from '@/types/app'

type DictationStatus = 'idle' | 'recording' | 'processing' | 'error'

interface UseDictationOptions {
  /** Optional custom field names for tenant-specific extraction */
  customFieldNames?: string[]
}

interface UseDictationReturn {
  /** Current dictation lifecycle status */
  status: DictationStatus
  /** Elapsed recording time in seconds */
  recordingDuration: number
  /** User-facing error message in Spanish, or null */
  error: string | null
  /** Request microphone permission and start recording */
  startRecording: () => Promise<void>
  /** Stop recording, send to API, return extracted fields */
  stopRecording: () => Promise<ExtractedMedicalFields | null>
  /** Cancel recording without processing */
  cancelRecording: () => void
}

/** Minimum recording duration in seconds to be considered valid */
const MIN_RECORDING_SECONDS = 1

/** Delay before auto-recovering from error state back to idle (ms) */
const ERROR_RECOVERY_DELAY_MS = 3000

/** Data collection interval for MediaRecorder (ms) */
const DATA_COLLECTION_INTERVAL_MS = 100

/** Duration timer tick interval (ms) */
const DURATION_TICK_INTERVAL_MS = 1000

/**
 * Determine the best supported audio MIME type for MediaRecorder.
 * Returns null if no supported type is found.
 */
function getSupportedMimeType(): string | null {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4',
  ]

  for (const type of types) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
      return type
    }
  }

  return null
}

/**
 * Hook for managing voice dictation with AI transcription and field extraction.
 *
 * Handles the full lifecycle: idle -> recording -> processing -> idle/error.
 * All user-facing error messages are in Spanish.
 *
 * @param options - Configuration options including optional custom field names
 * @returns Dictation state and control functions
 *
 * @example
 * ```tsx
 * const { status, recordingDuration, startRecording, stopRecording } = useDictation({
 *   customFieldNames: ['Alergias', 'Tipo de sangre']
 * })
 * ```
 */
export function useDictation(options: UseDictationOptions = {}): UseDictationReturn {
  const { customFieldNames = [] } = options

  const [status, setStatus] = useState<DictationStatus>('idle')
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Refs for MediaRecorder and audio data to avoid stale closures
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)
  const errorRecoveryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /**
   * Set error state with auto-recovery back to idle after delay.
   */
  const setErrorWithRecovery = useCallback((message: string) => {
    setError(message)
    setStatus('error')

    // Clear any existing recovery timer
    if (errorRecoveryTimerRef.current) {
      clearTimeout(errorRecoveryTimerRef.current)
    }

    errorRecoveryTimerRef.current = setTimeout(() => {
      setStatus('idle')
      errorRecoveryTimerRef.current = null
    }, ERROR_RECOVERY_DELAY_MS)
  }, [])

  /**
   * Clean up MediaRecorder resources, stream tracks, and timers.
   */
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    mediaRecorderRef.current = null
    audioChunksRef.current = []
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()

      if (errorRecoveryTimerRef.current) {
        clearTimeout(errorRecoveryTimerRef.current)
      }
    }
  }, [cleanup])

  /**
   * Request microphone permission and start audio recording.
   */
  const startRecording = useCallback(async () => {
    setError(null)

    // Check browser support for MediaRecorder
    if (typeof MediaRecorder === 'undefined' || typeof navigator.mediaDevices === 'undefined') {
      setErrorWithRecovery('Tu navegador no soporta grabación de audio.')
      return
    }

    // Check for a supported MIME type
    const mimeType = getSupportedMimeType()
    if (!mimeType) {
      setErrorWithRecovery('Tu navegador no soporta los formatos de audio necesarios.')
      return
    }

    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Create MediaRecorder with best available MIME type
      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      // Collect audio data chunks
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      // Start recording with periodic data collection
      mediaRecorder.start(DATA_COLLECTION_INTERVAL_MS)
      startTimeRef.current = Date.now()
      setRecordingDuration(0)
      setStatus('recording')

      // Start duration counter
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
        setRecordingDuration(elapsed)
      }, DURATION_TICK_INTERVAL_MS)
    } catch (err) {
      console.error('Microphone access error:', err)

      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setErrorWithRecovery(
            'No se pudo acceder al micrófono. Verifica los permisos de tu navegador.'
          )
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setErrorWithRecovery('No se encontró un micrófono. Conecta uno e intenta de nuevo.')
        } else {
          setErrorWithRecovery('Error al acceder al micrófono. Por favor intenta de nuevo.')
        }
      } else {
        setErrorWithRecovery('Error al acceder al micrófono. Por favor intenta de nuevo.')
      }

      cleanup()
    }
  }, [cleanup, setErrorWithRecovery])

  /**
   * Stop recording and send audio to the dictation API for processing.
   * Returns extracted medical fields on success, or null on failure.
   */
  const stopRecording = useCallback(async (): Promise<ExtractedMedicalFields | null> => {
    if (!mediaRecorderRef.current || status !== 'recording') {
      return null
    }

    // Stop the duration timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    // Validate minimum recording duration
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000)
    if (duration < MIN_RECORDING_SECONDS) {
      setErrorWithRecovery('La grabación fue muy corta. Intenta de nuevo.')
      cleanup()
      return null
    }

    // Wrap the async MediaRecorder.onstop in a promise
    return new Promise<ExtractedMedicalFields | null>((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!

      mediaRecorder.onstop = async () => {
        setStatus('processing')

        try {
          // Build audio blob from collected chunks
          const mimeType = mediaRecorder.mimeType
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })

          // Prepare multipart form data for the API
          const formData = new FormData()
          formData.append('audio', audioBlob, 'recording.webm')

          if (customFieldNames.length > 0) {
            formData.append('customFieldNames', JSON.stringify(customFieldNames))
          }

          // Send to the dictation API endpoint
          const response = await fetch('/api/ai/dictation', {
            method: 'POST',
            body: formData,
          })

          const result: DictationApiResponse = await response.json()

          cleanup()

          if (result.success) {
            setStatus('idle')
            setRecordingDuration(0)
            resolve(result.data.fields)
          } else {
            setErrorWithRecovery(result.error)
            resolve(null)
          }
        } catch (err) {
          console.error('Dictation API error:', err)
          cleanup()
          setErrorWithRecovery('Error de conexión. Verifica tu internet e intenta de nuevo.')
          resolve(null)
        }
      }

      // Stop the MediaRecorder (triggers onstop callback above)
      mediaRecorder.stop()

      // Stop media stream tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    })
  }, [status, customFieldNames, cleanup, setErrorWithRecovery])

  /**
   * Cancel recording without sending to the API.
   */
  const cancelRecording = useCallback(() => {
    if (status === 'recording') {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop()
      }

      cleanup()
      setStatus('idle')
      setRecordingDuration(0)
      setError(null)
    }
  }, [status, cleanup])

  return {
    status,
    recordingDuration,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
  }
}
