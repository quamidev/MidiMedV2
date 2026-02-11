/**
 * Patient AI Summary Component
 *
 * Full implementation of the AI-generated patient summary display. Manages
 * states for loading, generated, empty, and error conditions. Includes
 * regeneration functionality with API integration.
 *
 * Created: 2026-02-10 - MV2-018 Patient Detail Page
 * Updated: 2026-02-10 - MV2-034 Full implementation with AI summary display
 */

'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Sparkles,
  Brain,
  RefreshCw,
  AlertTriangle,
  Loader2,
  FileText,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  AiSummaryCard,
  AiSummaryCardSkeleton,
} from '@/components/patients/ai-summary-card'

interface PatientAiSummaryProps {
  patientId: string
  initialSummary: string | null
  summaryUpdatedAt?: string
  hasRecords?: boolean
  className?: string
  onSummaryUpdated?: (summary: string) => void
}

type SummaryState = 'idle' | 'loading' | 'error' | 'success'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
}

export function PatientAiSummary({
  patientId,
  initialSummary,
  summaryUpdatedAt,
  hasRecords = false,
  className,
  onSummaryUpdated,
}: PatientAiSummaryProps) {
  const [summary, setSummary] = useState(initialSummary)
  const [updatedAt, setUpdatedAt] = useState(summaryUpdatedAt)
  const [state, setState] = useState<SummaryState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const hasSummary = summary && summary.trim().length > 0

  const regenerateSummary = useCallback(async () => {
    setState('loading')
    setErrorMessage(null)

    try {
      const response = await fetch('/api/ai/patient-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al generar resumen')
      }

      setSummary(data.summary)
      setUpdatedAt(new Date().toISOString())
      setState('success')
      onSummaryUpdated?.(data.summary)

      toast.success('Resumen actualizado', {
        description: 'El analisis con IA ha sido regenerado.',
        icon: <Sparkles className="h-5 w-5 text-primary" />,
      })
    } catch (error) {
      console.error('Regenerate summary error:', error)
      const message =
        error instanceof Error ? error.message : 'Error inesperado'
      setErrorMessage(message)
      setState('error')
      toast.error('Error al regenerar', { description: message })
    }
  }, [patientId, onSummaryUpdated])

  const handleRetry = useCallback(() => {
    regenerateSummary()
  }, [regenerateSummary])

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm',
        className
      )}
    >
      {/* Subtle animated gradient background for AI feature */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] transition-opacity duration-500 group-hover:opacity-[0.05]"
        style={{
          background:
            'linear-gradient(135deg, var(--primary) 0%, transparent 40%, transparent 60%, var(--primary) 100%)',
        }}
      />

      {/* Header */}
      <div className="relative flex items-center gap-3 border-b border-border/50 px-4 py-3 md:px-5 md:py-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 via-primary/15 to-primary/10 shadow-sm"
        >
          <Sparkles className="h-5 w-5 text-primary" />
          {/* Subtle pulse effect */}
          <motion.div
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut',
            }}
            className="absolute inset-0 rounded-xl bg-primary/20"
          />
        </motion.div>
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-foreground md:text-base">
            Resumen con IA
          </h2>
          <p className="text-xs text-muted-foreground">
            Analisis inteligente del historial
          </p>
        </div>
        {hasSummary && state !== 'loading' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={regenerateSummary}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Regenerar</span>
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="relative p-4 md:p-5">
        <AnimatePresence mode="wait">
          {/* Loading State */}
          {state === 'loading' && (
            <motion.div
              key="loading"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col items-center justify-center py-8 text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5"
              >
                <Loader2 className="h-7 w-7 text-primary" />
              </motion.div>
              <p className="text-sm font-medium text-foreground">
                Analizando historial medico...
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                La IA esta procesando los expedientes del paciente
              </p>
            </motion.div>
          )}

          {/* Error State */}
          {state === 'error' && (
            <motion.div
              key="error"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col items-center justify-center py-8 text-center"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
                <AlertTriangle className="h-7 w-7 text-destructive" />
              </div>
              <p className="mb-1 text-sm font-medium text-foreground">
                Error al generar resumen
              </p>
              <p className="mb-4 max-w-xs text-xs text-muted-foreground">
                {errorMessage || 'Hubo un problema al procesar el analisis.'}
              </p>
              <Button variant="outline" size="sm" onClick={handleRetry}>
                <RefreshCw className="mr-1.5 h-4 w-4" />
                Reintentar
              </Button>
            </motion.div>
          )}

          {/* Summary Content */}
          {state !== 'loading' && state !== 'error' && hasSummary && (
            <motion.div
              key="summary"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <AiSummaryCard
                summary={summary}
                generatedAt={updatedAt}
                isRegenerating={false}
                onRegenerate={regenerateSummary}
              />
            </motion.div>
          )}

          {/* Empty State - No Records */}
          {state !== 'loading' &&
            state !== 'error' &&
            !hasSummary &&
            !hasRecords && (
              <motion.div
                key="empty-no-records"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex flex-col items-center justify-center py-8 text-center"
              >
                {/* Decorative brain icon with glow */}
                <div className="relative mb-4">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl"
                  />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 shadow-inner">
                    <Brain className="h-8 w-8 text-primary/60" />
                  </div>
                </div>

                <h3 className="mb-1.5 text-base font-medium text-foreground">
                  Analisis inteligente
                </h3>
                <p className="mb-4 max-w-xs text-sm text-muted-foreground">
                  La IA generara un resumen del historial medico cuando el
                  paciente tenga expedientes registrados.
                </p>

                <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Sin expedientes aun
                  </span>
                </div>
              </motion.div>
            )}

          {/* Empty State - Has Records but No Summary */}
          {state !== 'loading' &&
            state !== 'error' &&
            !hasSummary &&
            hasRecords && (
              <motion.div
                key="empty-with-records"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex flex-col items-center justify-center py-8 text-center"
              >
                <div className="relative mb-4">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl"
                  />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 shadow-inner">
                    <Sparkles className="h-8 w-8 text-primary/60" />
                  </div>
                </div>

                <h3 className="mb-1.5 text-base font-medium text-foreground">
                  Generar resumen con IA
                </h3>
                <p className="mb-4 max-w-xs text-sm text-muted-foreground">
                  Analiza el historial medico del paciente con inteligencia
                  artificial para obtener un resumen clinico.
                </p>

                <Button onClick={regenerateSummary} className="gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  Generar resumen
                </Button>
              </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export function PatientAiSummarySkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
      <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3 md:px-5 md:py-4">
        <div className="h-10 w-10 animate-pulse rounded-xl bg-muted" />
        <div className="flex-1 space-y-1.5">
          <div className="h-4 w-28 animate-pulse rounded bg-muted" />
          <div className="h-3 w-44 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="p-4 md:p-5">
        <AiSummaryCardSkeleton />
      </div>
    </div>
  )
}
