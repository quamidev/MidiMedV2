/**
 * Dictation Button Component
 *
 * Displays microphone button with four visual states for voice dictation:
 * idle, recording (with timer), processing, and error.
 * Used in the medical record form for AI-powered field extraction.
 *
 * Created: 2026-02-28 - DICT-004 AI Dictation Feature
 * Updated: 2026-02-28 - DICT-006 Enhanced pulse animation with GPU-optimized scale/opacity
 */

'use client'

import { Mic, Square, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface DictationButtonProps {
  status: 'idle' | 'recording' | 'processing' | 'error'
  recordingDuration: number
  disabled?: boolean
  onStartRecording: () => void
  onStopRecording: () => void
  className?: string
}

/**
 * Format seconds as M:SS string.
 * @example formatDuration(0) => "0:00"
 * @example formatDuration(75) => "1:15"
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/** Return a localized aria-label for each dictation state. */
function getAriaLabel(status: DictationButtonProps['status']): string {
  switch (status) {
    case 'idle':
      return 'Iniciar dictado'
    case 'recording':
      return 'Detener grabacion'
    case 'processing':
      return 'Procesando dictado'
    case 'error':
      return 'Error en dictado'
  }
}

export function DictationButton({
  status,
  recordingDuration,
  disabled = false,
  onStartRecording,
  onStopRecording,
  className,
}: DictationButtonProps) {
  const isRecording = status === 'recording'
  const isProcessing = status === 'processing'
  const isError = status === 'error'
  const isIdle = status === 'idle'

  const handleClick = () => {
    if (isRecording) {
      onStopRecording()
    } else if (isIdle) {
      onStartRecording()
    }
  }

  return (
    <div className={cn('relative inline-flex items-center gap-2', className)}>
      {/* Pulsing ring animation for recording state (z-0 keeps it behind the button) */}
      {isRecording && (
        <motion.div
          className="absolute inset-0 z-0 rounded-lg bg-destructive/20 will-change-transform"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      <Button
        type="button"
        variant={isRecording || isError ? 'destructive' : 'outline'}
        size="sm"
        disabled={disabled || isProcessing}
        onClick={handleClick}
        aria-label={getAriaLabel(status)}
        className={cn(
          'relative z-10 min-h-11 min-w-11 gap-2',
          isProcessing && 'cursor-wait',
          isError && 'animate-pulse'
        )}
      >
        {isIdle && <Mic className="h-4 w-4" />}
        {isRecording && (
          <>
            <Square className="h-4 w-4" />
            <span className="text-sm font-mono">
              {formatDuration(recordingDuration)}
            </span>
          </>
        )}
        {isProcessing && (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Procesando...</span>
          </>
        )}
        {isError && <Mic className="h-4 w-4" />}
      </Button>
    </div>
  )
}
