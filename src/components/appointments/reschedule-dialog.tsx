/**
 * RescheduleDialog - Confirmation dialog for appointment drag/resize operations
 *
 * Shows before/after time comparison when an appointment is dragged or resized
 * on the calendar. User must confirm or cancel the change.
 *
 * Features:
 * - Displays old vs new schedule with clear visual comparison
 * - Shows duration change for resize operations
 * - Spanish labels throughout
 * - Loading state during update
 * - Error handling with toast notifications
 *
 * Created: 2026-02-10 - MV2-025 Calendar Drag and Drop
 */

'use client'

import { useState } from 'react'
import { format, differenceInMinutes } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import { CalendarClock, Clock, ArrowRight, Maximize2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { updateAppointment } from '@/actions/appointments'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { AppointmentWithRelations } from '@/types/app'

// =============================================================================
// Types
// =============================================================================

export interface RescheduleInfo {
  appointment: AppointmentWithRelations
  oldStart: Date
  oldEnd: Date
  newStart: Date
  newEnd: Date
  isResize: boolean
}

interface RescheduleDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  onCancel: () => void
  rescheduleInfo: RescheduleInfo | null
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatDateTime(date: Date): string {
  return format(date, "EEEE, d 'de' MMMM 'a las' HH:mm", { locale: es })
}

function formatTime(date: Date): string {
  return format(date, 'HH:mm', { locale: es })
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minutos`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) {
    return hours === 1 ? '1 hora' : `${hours} horas`
  }
  return `${hours}h ${remainingMinutes}min`
}

// =============================================================================
// Component
// =============================================================================

export function RescheduleDialog({
  open,
  onClose,
  onConfirm,
  onCancel,
  rescheduleInfo,
}: RescheduleDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  if (!rescheduleInfo) {
    return null
  }

  const { appointment, oldStart, oldEnd, newStart, newEnd, isResize } = rescheduleInfo

  const oldDuration = differenceInMinutes(oldEnd, oldStart)
  const newDuration = differenceInMinutes(newEnd, newStart)
  const durationChanged = oldDuration !== newDuration

  const handleConfirm = async () => {
    setIsLoading(true)

    try {
      const result = await updateAppointment(appointment.id, {
        scheduledStart: newStart.toISOString(),
        scheduledEnd: newEnd.toISOString(),
      })

      if (result.success) {
        toast.success('Cita reprogramada exitosamente')
        onConfirm()
      } else {
        toast.error(result.error || 'Error al reprogramar la cita')
        onCancel()
      }
    } catch (error) {
      console.error('Error updating appointment:', error)
      toast.error('Error al reprogramar la cita')
      onCancel()
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    onCancel()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isResize ? (
              <Maximize2 className="h-5 w-5 text-primary" />
            ) : (
              <CalendarClock className="h-5 w-5 text-primary" />
            )}
            {isResize ? 'Cambiar duracion' : 'Reprogramar cita'}
          </DialogTitle>
          <DialogDescription>
            {isResize
              ? 'Confirma el cambio de duracion para esta cita.'
              : 'Confirma el nuevo horario para esta cita.'}
          </DialogDescription>
        </DialogHeader>

        {/* Patient info */}
        <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: appointment.provider_color || '#3abdd4' }}
            />
            <span className="font-medium text-foreground">
              {appointment.patient_name}
            </span>
          </div>
          {appointment.reason && (
            <p className="mt-1 text-sm text-muted-foreground">
              {appointment.reason}
            </p>
          )}
        </div>

        {/* Time comparison */}
        <div className="space-y-3">
          {/* Before */}
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Horario actual
              </p>
              <p className="text-sm text-foreground">
                {formatDateTime(oldStart)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatTime(oldStart)} - {formatTime(oldEnd)} ({formatDuration(oldDuration)})
              </p>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <ArrowRight className="h-4 w-4 text-primary" />
            </div>
          </div>

          {/* After */}
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-primary">
                Nuevo horario
              </p>
              <p className="text-sm font-medium text-foreground">
                {formatDateTime(newStart)}
              </p>
              <p className={cn(
                'text-xs',
                durationChanged ? 'font-medium text-primary' : 'text-muted-foreground'
              )}>
                {formatTime(newStart)} - {formatTime(newEnd)} ({formatDuration(newDuration)})
                {durationChanged && (
                  <span className="ml-1">
                    {newDuration > oldDuration ? '(+' : '('}
                    {newDuration - oldDuration} min)
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            isLoading={isLoading}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
