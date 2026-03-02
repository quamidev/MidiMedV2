/**
 * NoShowConfirmDialog - Confirmation dialog for marking appointment as no-show
 *
 * Shows a warning dialog when staff wants to mark an appointment as no-show.
 * Includes an optional checkbox to send email notification to the patient.
 *
 * Created: 2026-03-02 - AO-006 No Show confirmation dialog
 */

'use client'

import { useState, useCallback } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { AlertTriangle, Mail } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { markNoShow } from '@/actions/appointments'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import type { AppointmentWithRelations } from '@/types/app'

interface NoShowConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment: AppointmentWithRelations | null
  onConfirm: () => void
}

export function NoShowConfirmDialog({
  open,
  onOpenChange,
  appointment,
  onConfirm,
}: NoShowConfirmDialogProps) {
  const [sendEmail, setSendEmail] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const patientEmail = appointment?.patient_email
  const hasEmail = !!patientEmail

  // Format date/time for display
  const formattedDate = appointment
    ? format(new Date(appointment.scheduled_start), "EEEE, d 'de' MMMM", { locale: es })
    : ''
  const formattedTime = appointment
    ? format(new Date(appointment.scheduled_start), 'HH:mm', { locale: es })
    : ''

  const handleConfirm = useCallback(async () => {
    if (!appointment) return

    setIsLoading(true)
    try {
      const result = await markNoShow({
        appointmentId: appointment.id,
        sendEmail: sendEmail && hasEmail,
      })

      if (result.success) {
        toast.success('Cita marcada como no show')
        onOpenChange(false)
        setSendEmail(false)
        onConfirm()
      } else {
        toast.error(result.error || 'Error al marcar como no show')
      }
    } catch (error) {
      console.error('Error marking no-show:', error)
      toast.error('Error inesperado al marcar como no show')
    } finally {
      setIsLoading(false)
    }
  }, [appointment, sendEmail, hasEmail, onOpenChange, onConfirm])

  const handleCancel = useCallback(() => {
    onOpenChange(false)
    setSendEmail(false)
  }, [onOpenChange])

  if (!appointment) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
          </div>
          <AlertDialogTitle className="text-center">
            Marcar como No Show
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Confirma que{' '}
            <span className="font-medium text-foreground">
              {appointment.patient_name}
            </span>{' '}
            no se presento a la cita programada para el{' '}
            <span className="font-medium text-foreground capitalize">
              {formattedDate}
            </span>{' '}
            a las{' '}
            <span className="font-medium text-foreground">
              {formattedTime}
            </span>
            ?
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Email notification checkbox */}
        <div className="my-4 rounded-lg border border-border/50 bg-muted/30 p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="send-email"
              checked={sendEmail}
              onCheckedChange={(checked) => setSendEmail(checked === true)}
              disabled={!hasEmail}
              className="mt-0.5"
            />
            <div className="flex-1">
              <Label
                htmlFor="send-email"
                className={cn(
                  'text-sm font-medium cursor-pointer',
                  !hasEmail && 'text-muted-foreground cursor-not-allowed'
                )}
              >
                <Mail className="mr-1.5 inline-block h-3.5 w-3.5" />
                Enviar notificacion por correo al paciente
              </Label>
              {!hasEmail && (
                <p className="mt-1 text-xs text-muted-foreground">
                  El paciente no tiene correo registrado
                </p>
              )}
              {hasEmail && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Se enviara un correo a {patientEmail}
                </p>
              )}
            </div>
          </div>
        </div>

        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogCancel onClick={handleCancel} disabled={isLoading}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-amber-500 text-white hover:bg-amber-600"
          >
            {isLoading ? 'Procesando...' : 'Confirmar No Show'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
