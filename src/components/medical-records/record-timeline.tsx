/**
 * Record Timeline Component
 *
 * Reusable timeline wrapper for medical records. Handles the vertical layout,
 * scrolling behavior, and empty state. Designed for performance with large
 * record sets through visibility-based rendering.
 *
 * Created: 2026-02-10 - MV2-033 Medical Record Timeline
 */

'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Stethoscope, FileText, Activity, Plus } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { RecordCard } from '@/components/medical-records/record-card'
import type { MedicalRecord } from '@/types/app'

interface RecordTimelineProps {
  records: MedicalRecord[]
  showAll?: boolean
  maxVisible?: number
  onEdit: (record: MedicalRecord) => void
  onDeleted: (recordId: string) => void
  onShowMore?: () => void
  onCreateNew?: () => void
  className?: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
    },
  },
}

export function RecordTimeline({
  records,
  showAll = false,
  maxVisible = 5,
  onEdit,
  onDeleted,
  onShowMore,
  onCreateNew,
  className,
}: RecordTimelineProps) {
  // Sort records in reverse chronological order (most recent first)
  const sortedRecords = useMemo(() => {
    return [...records].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }, [records])

  const visibleRecords = showAll
    ? sortedRecords
    : sortedRecords.slice(0, maxVisible)
  const hiddenCount = sortedRecords.length - visibleRecords.length
  const hasRecords = records.length > 0

  if (!hasRecords) {
    return (
      <div className={cn('py-6 md:py-8', className)}>
        <div className="flex flex-col items-center justify-center text-center">
          {/* Decorative timeline illustration */}
          <div className="relative mb-5">
            <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-gradient-to-b from-border via-border to-transparent" />
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
              className="relative flex flex-col items-center gap-3"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-emerald-300 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:border-emerald-700 dark:from-emerald-950/50 dark:to-emerald-900/30">
                <Stethoscope className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-dashed border-border bg-muted/50">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-dashed border-border/50 bg-muted/30">
                <Activity className="h-3 w-3 text-muted-foreground/50" />
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="mb-1.5 text-base font-semibold text-foreground">
              Sin expedientes registrados
            </h3>
            <p className="mb-5 max-w-xs text-sm text-muted-foreground">
              Los registros de consultas, diagnosticos y tratamientos apareceran
              aqui en una linea de tiempo.
            </p>

            {onCreateNew && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCreateNew}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Crear primer expediente
              </Button>
            )}
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('relative', className)}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {visibleRecords.map((record, index) => (
          <motion.div key={record.id} variants={itemVariants}>
            <RecordCard
              record={record}
              isFirst={index === 0}
              isLast={index === visibleRecords.length - 1 && hiddenCount === 0}
              onEdit={onEdit}
              onDeleted={onDeleted}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Timeline end cap / Show more */}
      {hiddenCount > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="relative flex items-center gap-3 pl-1 md:gap-4"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-border bg-muted/50">
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onShowMore}
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Ver {hiddenCount} registro{hiddenCount !== 1 ? 's' : ''} anterior
            {hiddenCount !== 1 ? 'es' : ''}
          </Button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="relative flex items-center gap-3 pl-1 md:gap-4"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-border bg-muted/50">
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">Inicio del historial</p>
        </motion.div>
      )}
    </div>
  )
}

export function RecordTimelineSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4">
          <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
          <div className="flex-1 space-y-2 rounded-xl border border-border/50 p-4">
            <div className="flex items-center gap-2">
              <div className="h-4 w-28 animate-pulse rounded bg-muted" />
              <div className="h-3 w-3 animate-pulse rounded-full bg-muted" />
              <div className="h-3 w-3 animate-pulse rounded-full bg-muted" />
            </div>
            <div className="h-3 w-40 animate-pulse rounded bg-muted" />
            <div className="space-y-1.5 pt-2">
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
