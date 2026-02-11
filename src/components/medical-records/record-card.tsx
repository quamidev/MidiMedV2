/**
 * Record Card Component
 *
 * Expandable medical record card for timeline display. Shows summary preview
 * in collapsed state with vitals icons, expands to show full clinical details.
 * Features smooth Framer Motion animations and medical-themed visual design.
 *
 * Created: 2026-02-10 - MV2-033 Medical Record Timeline
 */

'use client'

import { useState, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  ChevronDown,
  FileText,
  Stethoscope,
  Thermometer,
  Heart,
  Ruler,
  Scale,
  Pill,
  CalendarClock,
  StickyNote,
  Download,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { deleteMedicalRecord } from '@/actions/medical-records'
import type { MedicalRecord } from '@/types/app'

interface RecordCardProps {
  record: MedicalRecord
  isFirst?: boolean
  isLast?: boolean
  onEdit: (record: MedicalRecord) => void
  onDeleted: (recordId: string) => void
}

const cardVariants = {
  collapsed: { height: 'auto' },
  expanded: { height: 'auto' },
}

const contentVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: {
    opacity: 1,
    height: 'auto',
    transition: {
      height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const },
      opacity: { duration: 0.2, delay: 0.1 },
    },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: {
      height: { duration: 0.25, ease: [0.4, 0, 0.2, 1] as const },
      opacity: { duration: 0.15 },
    },
  },
}

const chevronVariants = {
  collapsed: { rotate: 0 },
  expanded: { rotate: 180 },
}

export function RecordCard({
  record,
  isFirst = false,
  isLast = false,
  onEdit,
  onDeleted,
}: RecordCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const createdDate = parseISO(record.created_at)
  const hasVitals =
    record.height_cm ||
    record.weight_kg ||
    record.blood_pressure ||
    record.temperature_c
  const hasMedications =
    record.prescribed_medications && record.prescribed_medications.length > 0
  const hasPdf = record.summary_pdf?.download_url

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev)
  }, [])

  const handleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onEdit(record)
    },
    [onEdit, record]
  )

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setShowDeleteDialog(true)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    setIsDeleting(true)
    try {
      const result = await deleteMedicalRecord(record.id)
      if (result.success) {
        toast.success('Expediente eliminado')
        onDeleted(record.id)
      } else {
        toast.error('Error al eliminar', { description: result.error })
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Error inesperado')
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }, [record.id, onDeleted])

  const handleDownloadPdf = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!hasPdf || !record.summary_pdf?.download_url) return

      setIsDownloading(true)
      try {
        window.open(record.summary_pdf.download_url, '_blank')
      } catch (error) {
        console.error('Download error:', error)
        toast.error('Error al descargar PDF')
      } finally {
        setIsDownloading(false)
      }
    },
    [hasPdf, record.summary_pdf?.download_url]
  )

  return (
    <>
      <div className="relative flex gap-3 md:gap-4">
        {/* Timeline connector */}
        <div className="relative flex flex-col items-center">
          {/* Node */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className={cn(
              'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 shadow-sm transition-all duration-300',
              isFirst
                ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/30'
                : 'border-border bg-card hover:border-emerald-300 dark:hover:border-emerald-700'
            )}
          >
            <Stethoscope
              className={cn(
                'h-4 w-4 transition-colors',
                isFirst
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-muted-foreground'
              )}
            />
            {isFirst && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 500 }}
                className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-500"
              />
            )}
          </motion.div>
          {/* Vertical line */}
          {!isLast && (
            <div className="w-0.5 flex-1 bg-gradient-to-b from-border via-border to-transparent" />
          )}
        </div>

        {/* Content Card */}
        <motion.div
          layout
          variants={cardVariants}
          animate={isExpanded ? 'expanded' : 'collapsed'}
          className={cn(
            'group flex-1 cursor-pointer rounded-xl border bg-card shadow-sm transition-all duration-300',
            isFirst
              ? 'border-emerald-200/50 dark:border-emerald-800/30'
              : 'border-border/50 hover:border-border',
            isExpanded && 'shadow-md',
            !isLast && 'mb-4'
          )}
          onClick={toggleExpanded}
        >
          {/* Card Header */}
          <div className="flex items-start justify-between gap-2 p-3 md:p-4">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-foreground md:text-base">
                  Consulta medica
                </p>
                {hasVitals && (
                  <div className="flex items-center gap-0.5">
                    {record.blood_pressure && (
                      <Heart className="h-3 w-3 text-rose-500" />
                    )}
                    {record.temperature_c && (
                      <Thermometer className="h-3 w-3 text-amber-500" />
                    )}
                    {record.height_cm && (
                      <Ruler className="h-3 w-3 text-sky-500" />
                    )}
                    {record.weight_kg && (
                      <Scale className="h-3 w-3 text-violet-500" />
                    )}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {format(createdDate, "EEEE, d 'de' MMMM yyyy - HH:mm", {
                  locale: es,
                })}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {hasPdf && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={handleDownloadPdf}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              )}
              <motion.div
                variants={chevronVariants}
                animate={isExpanded ? 'expanded' : 'collapsed'}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              </motion.div>
            </div>
          </div>

          {/* Summary Preview (always visible) */}
          <div className="px-3 pb-3 md:px-4 md:pb-4">
            {record.summary && (
              <p
                className={cn(
                  'text-sm leading-relaxed text-foreground/80',
                  !isExpanded && 'line-clamp-2'
                )}
              >
                {record.summary}
              </p>
            )}

            {record.diagnosis && !isExpanded && (
              <div className="mt-2 rounded-lg bg-muted/50 px-3 py-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Diagnostico
                </p>
                <p className="line-clamp-1 text-sm text-foreground">
                  {record.diagnosis}
                </p>
              </div>
            )}
          </div>

          {/* Expanded Content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="overflow-hidden"
              >
                <div className="border-t border-border/50 px-3 py-4 md:px-4">
                  <div className="space-y-4">
                    {/* Diagnosis */}
                    {record.diagnosis && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Diagnostico
                          </span>
                        </div>
                        <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-foreground dark:bg-blue-950/30">
                          {record.diagnosis}
                        </p>
                      </div>
                    )}

                    {/* Vitals Grid */}
                    {hasVitals && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Heart className="h-4 w-4 text-rose-500" />
                          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Signos vitales
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                          {record.blood_pressure && (
                            <div className="rounded-lg bg-rose-50 px-3 py-2 dark:bg-rose-950/30">
                              <p className="text-xs text-rose-600 dark:text-rose-400">
                                Presion arterial
                              </p>
                              <p className="font-medium text-foreground">
                                {record.blood_pressure}
                              </p>
                            </div>
                          )}
                          {record.temperature_c && (
                            <div className="rounded-lg bg-amber-50 px-3 py-2 dark:bg-amber-950/30">
                              <p className="text-xs text-amber-600 dark:text-amber-400">
                                Temperatura
                              </p>
                              <p className="font-medium text-foreground">
                                {record.temperature_c}°C
                              </p>
                            </div>
                          )}
                          {record.height_cm && (
                            <div className="rounded-lg bg-sky-50 px-3 py-2 dark:bg-sky-950/30">
                              <p className="text-xs text-sky-600 dark:text-sky-400">
                                Altura
                              </p>
                              <p className="font-medium text-foreground">
                                {record.height_cm} cm
                              </p>
                            </div>
                          )}
                          {record.weight_kg && (
                            <div className="rounded-lg bg-violet-50 px-3 py-2 dark:bg-violet-950/30">
                              <p className="text-xs text-violet-600 dark:text-violet-400">
                                Peso
                              </p>
                              <p className="font-medium text-foreground">
                                {record.weight_kg} kg
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Medications */}
                    {hasMedications && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Pill className="h-4 w-4 text-amber-500" />
                          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Medicamentos
                          </span>
                        </div>
                        <div className="rounded-lg bg-amber-50 px-3 py-2 dark:bg-amber-950/30">
                          <ul className="space-y-1">
                            {record.prescribed_medications.map((med, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-2 text-sm text-foreground"
                              >
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                                {med}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Follow-up */}
                    {record.follow_up_instructions && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <CalendarClock className="h-4 w-4 text-indigo-500" />
                          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Seguimiento
                          </span>
                        </div>
                        <p className="rounded-lg bg-indigo-50 px-3 py-2 text-sm text-foreground dark:bg-indigo-950/30">
                          {record.follow_up_instructions}
                        </p>
                      </div>
                    )}

                    {/* Notes */}
                    {record.notes && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <StickyNote className="h-4 w-4 text-slate-500" />
                          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Notas
                          </span>
                        </div>
                        <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm italic text-muted-foreground dark:bg-slate-800/50">
                          {record.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 flex items-center justify-end gap-2 border-t border-border/50 pt-4">
                    {hasPdf && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadPdf}
                        disabled={isDownloading}
                        className="gap-1.5"
                      >
                        {isDownloading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Download className="h-3.5 w-3.5" />
                        )}
                        Descargar PDF
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEdit}
                      className="gap-1.5"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeleteClick}
                      className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle>Eliminar expediente medico</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. El expediente del{' '}
              {format(createdDate, "d 'de' MMMM yyyy", { locale: es })} sera
              eliminado permanentemente junto con su PDF asociado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar expediente'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
