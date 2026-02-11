/**
 * Medical Record Form Modal
 *
 * Comprehensive form for medical record data entry used when completing appointments
 * or editing existing records. Features organized sections for summary, vitals,
 * diagnosis, medications, follow-up, notes, and tenant-specific custom fields.
 *
 * Modes:
 * - Create: Used when completing an appointment (requires appointmentId + patientId)
 * - Edit: Used for standalone editing (requires existing recordId)
 *
 * Created: 2026-02-10 - MV2-029 Medical Record Form Modal
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  FileText,
  Stethoscope,
  Pill,
  CalendarClock,
  StickyNote,
  AlertCircle,
  ClipboardList,
  CheckCircle2,
  Loader2,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { useUser } from '@/contexts/user-context'
import { completeAppointment } from '@/actions/appointments'
import {
  createMedicalRecord,
  updateMedicalRecord,
} from '@/actions/medical-records'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { VitalsSection } from '@/components/medical-records/vitals-section'
import { CustomFieldsSection } from '@/components/medical-records/custom-fields-section'
import type {
  MedicalRecord,
  MedicalRecordWithRelations,
  CustomField,
} from '@/types/app'

// =============================================================================
// Validation Schema
// =============================================================================

const vitalsSchema = z.object({
  heightCm: z.number().positive('La altura debe ser positiva').nullable().optional(),
  weightKg: z.number().positive('El peso debe ser positivo').nullable().optional(),
  bloodPressure: z.string().optional(),
  temperatureC: z.number().nullable().optional(),
})

const medicalRecordFormSchema = z.object({
  summary: z.string().min(1, 'El resumen es requerido'),
  vitals: vitalsSchema.optional(),
  diagnosis: z.string().optional(),
  medications: z.string().optional(), // Textarea, one per line
  followUpInstructions: z.string().optional(),
  notes: z.string().optional(),
  extras: z.record(z.string(), z.unknown()).optional(),
})

type MedicalRecordFormValues = z.infer<typeof medicalRecordFormSchema>

// =============================================================================
// Types
// =============================================================================

interface MedicalRecordFormProps {
  /** Whether the modal is open */
  open: boolean
  /** Callback when modal should close */
  onClose: () => void
  /** Mode: 'create' for new records (from appointment), 'edit' for existing */
  mode: 'create' | 'edit'
  /** Patient ID (required for create mode) */
  patientId?: string
  /** Patient name for display */
  patientName?: string
  /** Appointment ID (required for create mode when completing appointment) */
  appointmentId?: string
  /** Existing medical record for edit mode */
  existingRecord?: MedicalRecord | MedicalRecordWithRelations
  /** Callback after successful creation */
  onCreated?: (record: MedicalRecord) => void
  /** Callback after successful update */
  onUpdated?: (record: MedicalRecord) => void
}

// =============================================================================
// Animation Variants
// =============================================================================

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
}

// =============================================================================
// Component
// =============================================================================

export function MedicalRecordForm({
  open,
  onClose,
  mode,
  patientId,
  patientName,
  appointmentId,
  existingRecord,
  onCreated,
  onUpdated,
}: MedicalRecordFormProps) {
  const { tenant } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentSection, setCurrentSection] = useState(0)

  // Get custom fields from tenant config
  const customFields: CustomField[] = useMemo(() => {
    if (!tenant?.extra_fields) return []
    return tenant.extra_fields as CustomField[]
  }, [tenant?.extra_fields])

  // Convert medications array to textarea string
  const medicationsToText = (meds?: string[]): string => {
    if (!meds || meds.length === 0) return ''
    return meds.join('\n')
  }

  // Convert textarea string to medications array
  const textToMedications = (text?: string): string[] => {
    if (!text || text.trim() === '') return []
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
  }

  // Build default values from existing record or empty
  const defaultValues = useMemo((): MedicalRecordFormValues => {
    if (mode === 'edit' && existingRecord) {
      return {
        summary: existingRecord.summary || '',
        vitals: {
          heightCm: existingRecord.height_cm ?? null,
          weightKg: existingRecord.weight_kg ?? null,
          bloodPressure: existingRecord.blood_pressure || '',
          temperatureC: existingRecord.temperature_c ?? null,
        },
        diagnosis: existingRecord.diagnosis || '',
        medications: medicationsToText(existingRecord.prescribed_medications),
        followUpInstructions: existingRecord.follow_up_instructions || '',
        notes: existingRecord.notes || '',
        extras: existingRecord.extras || {},
      }
    }
    return {
      summary: '',
      vitals: {
        heightCm: null,
        weightKg: null,
        bloodPressure: '',
        temperatureC: null,
      },
      diagnosis: '',
      medications: '',
      followUpInstructions: '',
      notes: '',
      extras: {},
    }
  }, [mode, existingRecord])

  // Form setup
  const form = useForm<MedicalRecordFormValues>({
    resolver: zodResolver(medicalRecordFormSchema),
    defaultValues,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = form

  // Reset form when modal opens or record changes
  useEffect(() => {
    if (open) {
      reset(defaultValues)
      setCurrentSection(0)
    }
  }, [open, defaultValues, reset])

  // Handle form submission
  const onSubmit = useCallback(
    async (data: MedicalRecordFormValues) => {
      setIsSubmitting(true)

      try {
        const medicationsArray = textToMedications(data.medications)

        if (mode === 'create') {
          // Create mode: complete appointment or create standalone record
          if (appointmentId) {
            // Complete appointment with medical record
            const result = await completeAppointment(appointmentId, {
              summary: data.summary,
              heightCm: data.vitals?.heightCm ?? undefined,
              weightKg: data.vitals?.weightKg ?? undefined,
              bloodPressure: data.vitals?.bloodPressure || undefined,
              temperatureC: data.vitals?.temperatureC ?? undefined,
              diagnosis: data.diagnosis || undefined,
              prescribedMedications: medicationsArray.length > 0 ? medicationsArray : undefined,
              followUpInstructions: data.followUpInstructions || undefined,
              notes: data.notes || undefined,
              extras: data.extras || undefined,
            })

            if (result.success) {
              toast.success('Cita completada exitosamente', {
                description: 'El expediente medico ha sido creado.',
                icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
              })
              onCreated?.(result.data.medicalRecord)
              onClose()
            } else {
              toast.error('Error al completar la cita', {
                description: result.error,
              })
            }
          } else if (patientId) {
            // Create standalone medical record
            const result = await createMedicalRecord({
              patientId,
              summary: data.summary,
              vitals: data.vitals
                ? {
                    heightCm: data.vitals.heightCm ?? undefined,
                    weightKg: data.vitals.weightKg ?? undefined,
                    bloodPressure: data.vitals.bloodPressure || undefined,
                    temperatureC: data.vitals.temperatureC ?? undefined,
                  }
                : undefined,
              diagnosis: data.diagnosis || undefined,
              prescribedMedications: medicationsArray.length > 0 ? medicationsArray : undefined,
              followUpInstructions: data.followUpInstructions || undefined,
              notes: data.notes || undefined,
              extras: data.extras || undefined,
            })

            if (result.success) {
              toast.success('Expediente creado exitosamente', {
                description: 'El expediente medico ha sido guardado.',
                icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
              })
              onCreated?.(result.data)
              onClose()
            } else {
              toast.error('Error al crear expediente', {
                description: result.error,
              })
            }
          } else {
            toast.error('Error de configuracion', {
              description: 'Falta el ID del paciente o cita.',
            })
          }
        } else if (mode === 'edit' && existingRecord) {
          // Edit mode: update existing record
          const result = await updateMedicalRecord(existingRecord.id, {
            summary: data.summary,
            vitals: data.vitals
              ? {
                  heightCm: data.vitals.heightCm ?? undefined,
                  weightKg: data.vitals.weightKg ?? undefined,
                  bloodPressure: data.vitals.bloodPressure || undefined,
                  temperatureC: data.vitals.temperatureC ?? undefined,
                }
              : undefined,
            diagnosis: data.diagnosis || undefined,
            prescribedMedications: medicationsArray.length > 0 ? medicationsArray : undefined,
            followUpInstructions: data.followUpInstructions || undefined,
            notes: data.notes || undefined,
            extras: data.extras || undefined,
          })

          if (result.success) {
            toast.success('Expediente actualizado', {
              description: 'Los cambios han sido guardados.',
              icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
            })
            onUpdated?.(result.data)
            onClose()
          } else {
            toast.error('Error al actualizar', {
              description: result.error,
            })
          }
        }
      } catch (error) {
        console.error('Medical record form error:', error)
        toast.error('Error inesperado', {
          description: 'Por favor intenta de nuevo.',
        })
      } finally {
        setIsSubmitting(false)
      }
    },
    [mode, appointmentId, patientId, existingRecord, onCreated, onUpdated, onClose]
  )

  // Section navigation for mobile
  const sections = [
    { id: 'summary', label: 'Resumen', icon: ClipboardList },
    { id: 'vitals', label: 'Vitales', icon: Stethoscope },
    { id: 'diagnosis', label: 'Diagnostico', icon: FileText },
    { id: 'treatment', label: 'Tratamiento', icon: Pill },
    { id: 'notes', label: 'Notas', icon: StickyNote },
  ]

  if (customFields.length > 0) {
    sections.push({ id: 'custom', label: 'Extras', icon: CalendarClock })
  }

  const modalTitle = mode === 'create'
    ? appointmentId
      ? 'Completar Cita'
      : 'Nuevo Expediente'
    : 'Editar Expediente'

  const modalDescription = mode === 'create'
    ? patientName
      ? `Registra la informacion de la consulta de ${patientName}`
      : 'Registra la informacion de la consulta medica'
    : 'Actualiza la informacion del expediente medico'

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
              <Stethoscope className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">{modalTitle}</DialogTitle>
              <DialogDescription>{modalDescription}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Mobile Section Tabs */}
        <div className="flex-shrink-0 sm:hidden overflow-x-auto pb-2 -mx-6 px-6">
          <div className="flex gap-1 min-w-max">
            {sections.map((section, index) => {
              const Icon = section.icon
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setCurrentSection(index)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                    currentSection === index
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {section.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Form Content */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto px-1 -mx-1"
        >
          <div className="space-y-8 py-4">
            {/* Summary Section - Always visible */}
            <AnimatePresence mode="wait">
              <motion.div
                key="summary"
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className={cn(
                  'space-y-4',
                  currentSection !== 0 && 'hidden sm:block'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 dark:from-emerald-400/20 dark:to-emerald-400/5">
                    <ClipboardList className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Resumen de la Consulta *
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Describe brevemente el motivo y hallazgos principales
                    </p>
                  </div>
                </div>
                <Textarea
                  id="summary"
                  placeholder="Paciente acude por dolor abdominal de 3 dias de evolucion..."
                  className={cn(
                    'min-h-[120px] resize-none',
                    errors.summary && 'border-destructive'
                  )}
                  {...register('summary')}
                />
                {errors.summary && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-destructive flex items-center gap-1"
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.summary.message}
                  </motion.p>
                )}
              </motion.div>
            </AnimatePresence>

            <Separator className={cn(currentSection !== 0 && 'hidden sm:block')} />

            {/* Vitals Section */}
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              className={cn(currentSection !== 1 && 'hidden sm:block')}
            >
              <VitalsSection form={form} fieldPrefix="vitals" />
            </motion.div>

            <Separator className={cn(currentSection !== 1 && 'hidden sm:block')} />

            {/* Diagnosis Section */}
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              className={cn(
                'space-y-4',
                currentSection !== 2 && 'hidden sm:block'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-500/5 dark:from-blue-400/20 dark:to-blue-400/5">
                  <FileText className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Diagnostico
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Diagnostico presuntivo o confirmado
                  </p>
                </div>
              </div>
              <Textarea
                id="diagnosis"
                placeholder="Gastritis aguda, probable H. pylori..."
                className="min-h-[80px] resize-none"
                {...register('diagnosis')}
              />
            </motion.div>

            <Separator className={cn(currentSection !== 2 && 'hidden sm:block')} />

            {/* Treatment Section - Medications & Follow-up */}
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              className={cn(
                'space-y-6',
                currentSection !== 3 && 'hidden sm:block'
              )}
            >
              {/* Medications */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-500/5 dark:from-amber-400/20 dark:to-amber-400/5">
                    <Pill className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Medicamentos
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Un medicamento por linea
                    </p>
                  </div>
                </div>
                <Textarea
                  id="medications"
                  placeholder={"Omeprazol 20mg - 1 cap cada 12h por 14 dias\nMetoclopramida 10mg - 1 tab antes de cada comida"}
                  className="min-h-[100px] resize-none font-mono text-sm"
                  {...register('medications')}
                />
              </div>

              {/* Follow-up Instructions */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 dark:from-indigo-400/20 dark:to-indigo-400/5">
                    <CalendarClock className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Instrucciones de Seguimiento
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Recomendaciones y proxima cita
                    </p>
                  </div>
                </div>
                <Textarea
                  id="followUpInstructions"
                  placeholder="Control en 2 semanas. Traer resultados de laboratorio..."
                  className="min-h-[80px] resize-none"
                  {...register('followUpInstructions')}
                />
              </div>
            </motion.div>

            <Separator className={cn(currentSection !== 3 && 'hidden sm:block')} />

            {/* Notes Section */}
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              className={cn(
                'space-y-4',
                currentSection !== 4 && 'hidden sm:block'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-slate-500/20 to-slate-500/5 dark:from-slate-400/20 dark:to-slate-400/5">
                  <StickyNote className="h-4.5 w-4.5 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Notas Adicionales
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Observaciones internas (no incluidas en el reporte)
                  </p>
                </div>
              </div>
              <Textarea
                id="notes"
                placeholder="Notas privadas del medico..."
                className="min-h-[80px] resize-none"
                {...register('notes')}
              />
            </motion.div>

            {/* Custom Fields Section */}
            {customFields.length > 0 && (
              <>
                <Separator className={cn(currentSection !== 5 && 'hidden sm:block')} />
                <motion.div
                  variants={sectionVariants}
                  initial="hidden"
                  animate="visible"
                  className={cn(currentSection !== 5 && 'hidden sm:block')}
                >
                  <CustomFieldsSection
                    customFields={customFields}
                    form={form}
                    fieldPrefix="extras"
                  />
                </motion.div>
              </>
            )}
          </div>
        </form>

        {/* Form Actions - Fixed at bottom */}
        <div className="flex-shrink-0 flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-border bg-background">
          {/* Mobile Navigation */}
          <div className="sm:hidden flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentSection === 0}
              onClick={() => setCurrentSection((prev) => Math.max(0, prev - 1))}
              className="flex-1"
            >
              Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentSection === sections.length - 1}
              onClick={() => setCurrentSection((prev) => Math.min(sections.length - 1, prev + 1))}
              className="flex-1"
            >
              Siguiente
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 sm:ml-auto">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="min-w-[140px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : mode === 'create' ? (
                appointmentId ? 'Completar Cita' : 'Crear Expediente'
              ) : (
                'Guardar Cambios'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
