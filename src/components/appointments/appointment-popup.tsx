/**
 * AppointmentPopup - Detail popup shown when clicking a calendar event
 *
 * Features:
 * - Patient name with link to profile
 * - Provider name and color accent
 * - Date/Time in Spanish format
 * - Status badge (scheduled=blue, completed=green, cancelled=red)
 * - Contextual action buttons based on status
 * - Cancel confirmation dialog
 * - Smooth animations and transitions
 * - Works as both Popover (with trigger) and Dialog (controlled)
 *
 * Created: 2026-02-10 - MV2-024 Appointment Detail Popup
 * Updated: 2026-03-02 - AO-007 Added no_show and rescheduled status badge entries
 * Updated: 2026-03-02 - AO-005/AO-006 Added No Show and Reschedule buttons, NoShowConfirmDialog integration
 */

'use client'

import { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  FileText,
  Download,
  Pencil,
  X,
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
  UserX,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
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
import { cancelAppointment, reactivateAppointment } from '@/actions/appointments'
import { NoShowConfirmDialog } from '@/components/appointments/no-show-confirm-dialog'
import type { AppointmentWithRelations, AppointmentStatus } from '@/types/app'

// =============================================================================
// Types
// =============================================================================

interface AppointmentPopupBaseProps {
  appointment: AppointmentWithRelations | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (appointment: AppointmentWithRelations) => void
  onComplete?: (appointment: AppointmentWithRelations) => void
  onReschedule?: (appointment: AppointmentWithRelations) => void
  onActionComplete?: () => void
}

interface AppointmentPopupWithTriggerProps extends AppointmentPopupBaseProps {
  children: React.ReactNode
  mode?: 'popover'
}

interface AppointmentPopupDialogProps extends AppointmentPopupBaseProps {
  children?: never
  mode: 'dialog'
}

type AppointmentPopupProps = AppointmentPopupWithTriggerProps | AppointmentPopupDialogProps

// =============================================================================
// Status Badge Component
// =============================================================================

const statusConfig: Record<
  AppointmentStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  scheduled: {
    label: 'Programada',
    className:
      'bg-sky-500/10 text-sky-600 dark:text-sky-400 ring-sky-500/20',
    icon: <Clock className="h-3 w-3" />,
  },
  completed: {
    label: 'Completada',
    className:
      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  cancelled: {
    label: 'Cancelada',
    className:
      'bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-rose-500/20',
    icon: <X className="h-3 w-3" />,
  },
  no_show: {
    label: 'No Show',
    className:
      'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20',
    icon: <UserX className="h-3 w-3" />,
  },
  rescheduled: {
    label: 'Reprogramada',
    className:
      'bg-slate-500/10 text-slate-600 dark:text-slate-400 ring-slate-500/20',
    icon: <RefreshCw className="h-3 w-3" />,
  },
}

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const config = statusConfig[status]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1',
        'text-xs font-medium ring-1 ring-inset',
        'transition-all duration-200',
        config.className
      )}
    >
      {config.icon}
      {config.label}
    </span>
  )
}

// =============================================================================
// Info Row Component
// =============================================================================

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-muted/50">
        {icon}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
          {label}
        </span>
        <div className="text-sm font-medium text-foreground">{children}</div>
      </div>
    </div>
  )
}

// =============================================================================
// Popup Content Component (shared between Popover and Dialog modes)
// =============================================================================

interface PopupContentProps {
  appointment: AppointmentWithRelations
  formattedDateTime: { date: string; time: string }
  onEdit?: (appointment: AppointmentWithRelations) => void
  onComplete?: (appointment: AppointmentWithRelations) => void
  onReschedule?: (appointment: AppointmentWithRelations) => void
  onOpenChange: (open: boolean) => void
  onShowCancelDialog: () => void
  onShowNoShowDialog: () => void
  onReactivate: () => void
  isLoading: boolean
}

function PopupContent({
  appointment,
  formattedDateTime,
  onEdit,
  onComplete,
  onReschedule,
  onOpenChange,
  onShowCancelDialog,
  onShowNoShowDialog,
  onReactivate,
  isLoading,
}: PopupContentProps) {
  // Handle edit
  const handleEdit = useCallback(() => {
    if (!onEdit) return
    onOpenChange(false)
    onEdit(appointment)
  }, [appointment, onEdit, onOpenChange])

  // Handle complete
  const handleComplete = useCallback(() => {
    if (!onComplete) return
    onOpenChange(false)
    onComplete(appointment)
  }, [appointment, onComplete, onOpenChange])

  // Handle no-show button click
  const handleShowNoShowDialog = useCallback(() => {
    onShowNoShowDialog()
  }, [onShowNoShowDialog])

  // Handle reschedule button click
  const handleReschedule = useCallback(() => {
    if (!onReschedule) return
    onOpenChange(false)
    onReschedule(appointment)
  }, [appointment, onReschedule, onOpenChange])

  // Handle view medical record
  const handleViewRecord = useCallback(() => {
    if (!appointment.medical_record_id) return
    toast.info('Navegando al expediente médico...')
    onOpenChange(false)
  }, [appointment, onOpenChange])

  // Handle download PDF
  const handleDownloadPdf = useCallback(() => {
    if (!appointment.medical_record_id) return
    toast.info('Descargando PDF...')
  }, [appointment])

  return (
    <>
      {/* Provider color accent bar */}
      <div
        className="absolute inset-x-0 top-0 h-1.5"
        style={{ backgroundColor: appointment.provider_color || '#3abdd4' }}
      />

      {/* Content */}
      <div className="pt-2">
        {/* Header: Patient name + Status */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <Link
            href={`/patients/${appointment.patient_id}`}
            className={cn(
              'group flex items-center gap-2',
              'text-base font-semibold text-foreground',
              'transition-colors duration-200',
              'hover:text-primary'
            )}
            onClick={() => onOpenChange(false)}
          >
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full',
                'bg-muted text-muted-foreground',
                'transition-all duration-200',
                'group-hover:bg-primary/10 group-hover:text-primary'
              )}
            >
              <User className="h-4 w-4" />
            </div>
            <span className="truncate">{appointment.patient_name}</span>
          </Link>
          <StatusBadge status={appointment.status} />
        </div>

        {/* Info rows */}
        <div className="space-y-3">
          {/* Provider */}
          <InfoRow
            icon={
              <Stethoscope
                className="h-4 w-4"
                style={{ color: appointment.provider_color || '#3abdd4' }}
              />
            }
            label="Proveedor"
          >
            {appointment.provider_name}
          </InfoRow>

          {/* Date */}
          <InfoRow
            icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
            label="Fecha"
          >
            <span className="capitalize">{formattedDateTime.date}</span>
          </InfoRow>

          {/* Time */}
          <InfoRow
            icon={<Clock className="h-4 w-4 text-muted-foreground" />}
            label="Hora"
          >
            {formattedDateTime.time}
          </InfoRow>

          {/* Reason/Notes */}
          {appointment.reason && (
            <InfoRow
              icon={<FileText className="h-4 w-4 text-muted-foreground" />}
              label="Motivo"
            >
              <span className="line-clamp-2 text-muted-foreground">
                {appointment.reason}
              </span>
            </InfoRow>
          )}
        </div>

        {/* Divider */}
        <div className="my-4 h-px bg-border/50" />

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {appointment.status === 'scheduled' && (
            <>
              <div className="flex gap-2">
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEdit}
                    className="flex-1"
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Editar
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShowNoShowDialog}
                  className="flex-1 text-amber-600 hover:bg-amber-500/10 hover:text-amber-600 border-amber-200 dark:border-amber-800"
                >
                  <UserX className="mr-1.5 h-3.5 w-3.5" />
                  No Show
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onShowCancelDialog}
                  className="flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="mr-1.5 h-3.5 w-3.5" />
                  Cancelar
                </Button>
              </div>
              {onReschedule && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReschedule}
                  className="w-full"
                >
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                  Reprogramar
                </Button>
              )}
              {onComplete && (
                <Button
                  size="sm"
                  onClick={handleComplete}
                  className="w-full"
                >
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  Completar
                </Button>
              )}
            </>
          )}

          {appointment.status === 'completed' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewRecord}
                className="flex-1"
                disabled={!appointment.medical_record_id}
              >
                <FileText className="mr-1.5 h-3.5 w-3.5" />
                Ver Expediente
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPdf}
                className="flex-1"
                disabled={!appointment.medical_record_id}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Descargar PDF
              </Button>
            </>
          )}

          {appointment.status === 'cancelled' && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReactivate}
              isLoading={isLoading}
              className="w-full"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Reactivar Cita
            </Button>
          )}

          {appointment.status === 'no_show' && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReactivate}
              isLoading={isLoading}
              className="w-full"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Reactivar Cita
            </Button>
          )}

          {appointment.status === 'rescheduled' && (
            <div className="text-center text-sm text-muted-foreground">
              Esta cita fue reprogramada
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function AppointmentPopup(props: AppointmentPopupProps) {
  const {
    appointment,
    open,
    onOpenChange,
    onEdit,
    onComplete,
    onReschedule,
    onActionComplete,
    mode = 'popover',
  } = props

  const children = 'children' in props ? props.children : undefined

  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showNoShowDialog, setShowNoShowDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Format date and time
  const formattedDateTime = useMemo(() => {
    if (!appointment) return { date: '', time: '' }

    const start = new Date(appointment.scheduled_start)
    const end = new Date(appointment.scheduled_end)

    return {
      date: format(start, "EEEE, d 'de' MMMM", { locale: es }),
      time: `${format(start, 'HH:mm', { locale: es })} - ${format(end, 'HH:mm', { locale: es })}`,
    }
  }, [appointment])

  // Handle cancel appointment
  const handleCancel = useCallback(async () => {
    if (!appointment) return

    setIsLoading(true)
    try {
      const result = await cancelAppointment(appointment.id)
      if (result.success) {
        toast.success('Cita cancelada correctamente')
        setShowCancelDialog(false)
        onOpenChange(false)
        onActionComplete?.()
      } else {
        toast.error(result.error || 'Error al cancelar la cita')
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error)
      toast.error('Error inesperado al cancelar la cita')
    } finally {
      setIsLoading(false)
    }
  }, [appointment, onOpenChange, onActionComplete])

  // Handle reactivate appointment
  const handleReactivate = useCallback(async () => {
    if (!appointment) return

    setIsLoading(true)
    try {
      const result = await reactivateAppointment(appointment.id)
      if (result.success) {
        toast.success('Cita reactivada correctamente')
        onOpenChange(false)
        onActionComplete?.()
      } else {
        toast.error(result.error || 'Error al reactivar la cita')
      }
    } catch (error) {
      console.error('Error reactivating appointment:', error)
      toast.error('Error inesperado al reactivar la cita')
    } finally {
      setIsLoading(false)
    }
  }, [appointment, onOpenChange, onActionComplete])

  // Empty state
  if (!appointment) {
    if (mode === 'popover' && children) {
      return <>{children}</>
    }
    return null
  }

  const contentProps: PopupContentProps = {
    appointment,
    formattedDateTime,
    onEdit,
    onComplete,
    onReschedule,
    onOpenChange,
    onShowCancelDialog: () => setShowCancelDialog(true),
    onShowNoShowDialog: () => setShowNoShowDialog(true),
    onReactivate: handleReactivate,
    isLoading,
  }

  // Render based on mode
  const content = (
    <>
      {mode === 'popover' && children ? (
        <Popover open={open} onOpenChange={onOpenChange}>
          <PopoverTrigger asChild>{children}</PopoverTrigger>
          <PopoverContent
            className={cn(
              'relative w-[320px] overflow-hidden p-4',
              'border-border/50 shadow-xl'
            )}
            align="start"
            sideOffset={8}
          >
            <PopupContent {...contentProps} />
          </PopoverContent>
        </Popover>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="relative max-w-[360px] gap-0 overflow-hidden p-4 sm:max-w-[400px]">
            <DialogHeader className="sr-only">
              <DialogTitle>Detalles de la Cita</DialogTitle>
            </DialogHeader>
            <PopupContent {...contentProps} />
          </DialogContent>
        </Dialog>
      )}

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-center">
              Cancelar Cita
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              ¿Estas seguro de que deseas cancelar la cita de{' '}
              <span className="font-medium text-foreground">
                {appointment.patient_name}
              </span>{' '}
              programada para el{' '}
              <span className="font-medium text-foreground">
                {formattedDateTime.date}
              </span>{' '}
              a las{' '}
              <span className="font-medium text-foreground">
                {formattedDateTime.time.split(' - ')[0]}
              </span>
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogCancel disabled={isLoading}>
              No, mantener cita
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? 'Cancelando...' : 'Sí, cancelar cita'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* No Show Confirmation Dialog */}
      <NoShowConfirmDialog
        open={showNoShowDialog}
        onOpenChange={setShowNoShowDialog}
        appointment={appointment}
        onConfirm={() => {
          onOpenChange(false)
          onActionComplete?.()
        }}
      />
    </>
  )

  return content
}
