/**
 * CreateAppointmentModal - Modal dialog for scheduling new appointments
 *
 * Features:
 * - Patient autocomplete search with debounced input
 * - Provider dropdown from tenant team members
 * - Date picker with calendar
 * - Start time picker with 10-minute intervals
 * - Auto-calculated end time based on tenant's appointment duration
 * - Warning banner for times outside working hours
 * - Spanish labels throughout
 * - Zod validation for all required fields
 * - Can be triggered by "Nueva Cita" button or clicking empty calendar slot
 *
 * Created: 2026-02-10 - MV2-023 Create Appointment Modal
 */

'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { format, isBefore, startOfDay, addMinutes, setHours, setMinutes } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  CalendarPlus,
  Calendar as CalendarIcon,
  Clock,
  User,
  UserCog,
  AlertTriangle,
  StickyNote,
} from 'lucide-react'
import type { SlotInfo } from 'react-big-calendar'

import { cn } from '@/lib/utils'
import { useUser } from '@/contexts/user-context'
import { createAppointment } from '@/actions/appointments'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { PatientAutocomplete } from './patient-autocomplete'
import {
  TimeSlotPicker,
  calculateEndTime,
  isWithinWorkingHours,
} from './time-slot-picker'
import type { Patient, User as AppUser, WorkingHours } from '@/types/app'

// =============================================================================
// Types
// =============================================================================

interface CreateAppointmentModalProps {
  open: boolean
  onClose: () => void
  onCreated?: () => void
  /** Pre-fill from calendar slot selection */
  slotInfo?: SlotInfo | null
  /** Available providers in the tenant */
  providers?: AppUser[]
}

interface ProviderOption {
  id: string
  name: string
  color: string
}

// =============================================================================
// Validation Schema
// =============================================================================

const createAppointmentFormSchema = z.object({
  patient: z.custom<Patient>((val) => val !== null && typeof val === 'object' && 'id' in val, {
    message: 'Selecciona un paciente',
  }),
  providerId: z.string().uuid('Selecciona un proveedor'),
  date: z.date({ message: 'La fecha es requerida' }),
  startTime: z.string().min(1, 'Selecciona una hora de inicio'),
  notes: z.string().optional(),
})

type CreateAppointmentFormData = z.infer<typeof createAppointmentFormSchema>

// =============================================================================
// Helpers
// =============================================================================

/**
 * Gets the day key for working hours lookup
 */
function getDayKey(date: Date): keyof WorkingHours {
  const dayIndex = date.getDay()
  const days: (keyof WorkingHours)[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  return days[dayIndex] || 'mon'
}

/**
 * Extracts time string from Date object
 */
function extractTimeFromDate(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = Math.floor(date.getMinutes() / 10) * 10 // Round to nearest 10
  return `${hours}:${minutes.toString().padStart(2, '0')}`
}

// =============================================================================
// Component
// =============================================================================

export function CreateAppointmentModal({
  open,
  onClose,
  onCreated,
  slotInfo,
  providers = [],
}: CreateAppointmentModalProps) {
  const { user, tenant } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  // Appointment duration from tenant settings (default 30 minutes)
  const appointmentDuration = tenant?.appointment_duration_minutes ?? 30

  // Working hours from tenant settings
  const workingHours = tenant?.working_hours as WorkingHours | undefined

  // Calculate default values from slotInfo
  const defaultValues = useMemo(() => {
    const defaults: Partial<CreateAppointmentFormData> = {
      notes: '',
    }

    if (slotInfo?.start) {
      defaults.date = startOfDay(slotInfo.start)
      defaults.startTime = extractTimeFromDate(slotInfo.start)
    }

    return defaults
  }, [slotInfo])

  const form = useForm<CreateAppointmentFormData>({
    resolver: zodResolver(createAppointmentFormSchema),
    defaultValues: {
      patient: undefined,
      providerId: user?.id || '',
      date: defaultValues.date,
      startTime: defaultValues.startTime || '',
      notes: '',
    },
  })

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = form

  // Watch form values for derived state
  const selectedDate = watch('date')
  const selectedStartTime = watch('startTime')

  // Reset form when modal opens with new slotInfo
  useEffect(() => {
    if (open) {
      reset({
        patient: undefined,
        providerId: user?.id || '',
        date: defaultValues.date,
        startTime: defaultValues.startTime || '',
        notes: '',
      })
    }
  }, [open, reset, user?.id, defaultValues])

  // Calculate end time
  const calculatedEndTime = useMemo(() => {
    if (!selectedStartTime) return null
    return calculateEndTime(selectedStartTime, appointmentDuration)
  }, [selectedStartTime, appointmentDuration])

  // Check if time is within working hours
  const isOutsideWorkingHours = useMemo(() => {
    if (!selectedDate || !selectedStartTime || !workingHours) return false

    const dayKey = getDayKey(selectedDate)
    const dayHours = workingHours[dayKey]

    if (!dayHours) return true // Clinic is closed on this day

    const startInRange = isWithinWorkingHours(selectedStartTime, dayHours)
    const endInRange = calculatedEndTime
      ? isWithinWorkingHours(calculatedEndTime, dayHours) || calculatedEndTime === dayHours[1]
      : true

    return !startInRange || !endInRange
  }, [selectedDate, selectedStartTime, calculatedEndTime, workingHours])

  // Get working hours message for selected day
  const workingHoursMessage = useMemo(() => {
    if (!selectedDate || !workingHours) return null

    const dayKey = getDayKey(selectedDate)
    const dayHours = workingHours[dayKey]

    if (!dayHours) {
      return 'La clinica esta cerrada este dia'
    }

    return `Horario de atencion: ${dayHours[0]} - ${dayHours[1]}`
  }, [selectedDate, workingHours])

  // Provider options with colors
  const providerOptions: ProviderOption[] = useMemo(() => {
    // If no providers passed, use current user as default
    if (providers.length === 0 && user) {
      return [
        {
          id: user.id,
          name: user.display_name,
          color: user.color || '#3abdd4',
        },
      ]
    }

    return providers.map((p) => ({
      id: p.id,
      name: p.display_name,
      color: p.color || '#3abdd4',
    }))
  }, [providers, user])

  const handleClose = useCallback(() => {
    reset()
    onClose()
  }, [reset, onClose])

  const onSubmit = useCallback(
    async (data: CreateAppointmentFormData) => {
      setIsSubmitting(true)

      try {
        // Construct ISO datetime strings
        const [startHour, startMinute] = data.startTime.split(':').map(Number)
        const scheduledStart = setMinutes(
          setHours(data.date, startHour || 0),
          startMinute || 0
        )
        const scheduledEnd = addMinutes(scheduledStart, appointmentDuration)

        const result = await createAppointment({
          patientId: data.patient.id,
          providerId: data.providerId,
          scheduledStart: scheduledStart.toISOString(),
          scheduledEnd: scheduledEnd.toISOString(),
          reason: data.notes || undefined,
        })

        if (result.success) {
          const patientName = `${data.patient.first_name} ${data.patient.last_name}`.trim()
          toast.success('Cita creada exitosamente', {
            description: `Cita con ${patientName} para ${format(scheduledStart, "d 'de' MMMM 'a las' HH:mm", { locale: es })}`,
          })
          reset()
          onCreated?.()
          onClose()
        } else {
          toast.error('Error al crear la cita', {
            description: result.error,
          })
        }
      } catch (error) {
        console.error('Create appointment error:', error)
        toast.error('Error inesperado', {
          description: 'Por favor intenta de nuevo.',
        })
      } finally {
        setIsSubmitting(false)
      }
    },
    [appointmentDuration, reset, onCreated, onClose]
  )

  const today = startOfDay(new Date())

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <CalendarPlus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">Nueva Cita</DialogTitle>
              <DialogDescription>
                Programa una nueva cita para un paciente
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
          {/* Patient Selection */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <Label>Paciente *</Label>
            </div>
            <Controller
              control={control}
              name="patient"
              render={({ field }) => (
                <PatientAutocomplete
                  value={field.value as Patient | null}
                  onChange={field.onChange}
                  error={!!errors.patient}
                  placeholder="Buscar paciente por nombre..."
                />
              )}
            />
            {errors.patient && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {errors.patient.message}
              </p>
            )}
          </div>

          {/* Provider Selection */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <UserCog className="h-4 w-4 text-primary" />
              <Label>Proveedor *</Label>
            </div>
            <Controller
              control={control}
              name="providerId"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger error={!!errors.providerId}>
                    <SelectValue placeholder="Seleccionar proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {providerOptions.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: provider.color }}
                          />
                          <span>{provider.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.providerId && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {errors.providerId.message}
              </p>
            )}
          </div>

          {/* Date and Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date Selection */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-primary" />
                <Label>Fecha *</Label>
              </div>
              <Controller
                control={control}
                name="date"
                render={({ field }) => (
                  <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal h-11',
                          !field.value && 'text-muted-foreground',
                          errors.date && 'border-destructive'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? (
                          format(field.value, "EEE, d 'de' MMMM", { locale: es })
                        ) : (
                          <span>Seleccionar fecha</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date)
                          setDatePickerOpen(false)
                        }}
                        disabled={(date) => isBefore(startOfDay(date), today)}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.date && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.date.message}
                </p>
              )}
            </div>

            {/* Time Selection */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <Label>Hora de inicio *</Label>
              </div>
              <Controller
                control={control}
                name="startTime"
                render={({ field }) => (
                  <TimeSlotPicker
                    value={field.value}
                    onChange={field.onChange}
                    error={!!errors.startTime}
                    placeholder="Seleccionar hora"
                  />
                )}
              />
              {errors.startTime && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.startTime.message}
                </p>
              )}
            </div>
          </div>

          {/* Calculated End Time Display */}
          {selectedStartTime && calculatedEndTime && (
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                La cita terminara a las{' '}
                <span className="font-medium text-foreground">{calculatedEndTime}</span>
                <span className="text-xs ml-2">({appointmentDuration} min)</span>
              </span>
            </div>
          )}

          {/* Working Hours Warning */}
          {isOutsideWorkingHours && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30 px-4 py-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Fuera del horario de atencion
                </p>
                <p className="text-amber-700 dark:text-amber-300 mt-0.5">
                  {workingHoursMessage}
                </p>
              </div>
            </div>
          )}

          {/* Notes Field */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-primary" />
              <Label htmlFor="notes">Notas</Label>
            </div>
            <Controller
              control={control}
              name="notes"
              render={({ field }) => (
                <Textarea
                  id="notes"
                  placeholder="Motivo de la consulta u observaciones adicionales..."
                  className="min-h-[80px] resize-none"
                  {...field}
                />
              )}
            />
          </div>

          {/* Form Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none sm:min-w-[140px]"
            >
              {isSubmitting ? 'Guardando...' : 'Crear Cita'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
