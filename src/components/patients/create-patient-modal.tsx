/**
 * Create Patient Modal
 *
 * Modal dialog for adding new patients with validated form fields.
 * Features birth date picker with future date prevention, sex selection,
 * and comprehensive optional fields for complete patient profiles.
 *
 * Created: 2026-02-10 - MV2-017 Create patient modal
 */

'use client'

import { useState, useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { format, isAfter, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  User,
  Calendar as CalendarIcon,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  StickyNote,
  UserPlus,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { createPatient } from '@/actions/patients'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

// =============================================================================
// Validation Schema
// =============================================================================

const createPatientFormSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre es muy largo'),
  birthDate: z.date({ message: 'La fecha de nacimiento es requerida' }),
  sex: z.enum(['M', 'F', 'O'], { message: 'Selecciona el sexo del paciente' }),
  phone: z.string().optional(),
  email: z
    .string()
    .email('Correo electronico invalido')
    .optional()
    .or(z.literal('')),
  address: z.string().optional(),
  allergies: z.string().optional(),
  notes: z.string().optional(),
})

type CreatePatientFormData = z.infer<typeof createPatientFormSchema>

// =============================================================================
// Component Props
// =============================================================================

interface CreatePatientModalProps {
  open: boolean
  onClose: () => void
  onCreated?: () => void
}

// =============================================================================
// Sex Options
// =============================================================================

const SEX_OPTIONS = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Femenino' },
  { value: 'O', label: 'Otro' },
] as const

// =============================================================================
// Component
// =============================================================================

export function CreatePatientModal({
  open,
  onClose,
  onCreated,
}: CreatePatientModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  const form = useForm<CreatePatientFormData>({
    resolver: zodResolver(createPatientFormSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      address: '',
      allergies: '',
      notes: '',
    },
  })

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = form

  const handleClose = useCallback(() => {
    reset()
    onClose()
  }, [reset, onClose])

  const onSubmit = useCallback(
    async (data: CreatePatientFormData) => {
      setIsSubmitting(true)

      try {
        const result = await createPatient({
          name: data.name,
          birthDate: format(data.birthDate, 'yyyy-MM-dd'),
          sex: data.sex,
          phone: data.phone || undefined,
          email: data.email || undefined,
          address: data.address || undefined,
          allergies: data.allergies || undefined,
          notes: data.notes || undefined,
        })

        if (result.success) {
          toast.success('Paciente creado exitosamente', {
            description: `${data.name} ha sido agregado al sistema.`,
          })
          reset()
          onCreated?.()
          onClose()
        } else {
          toast.error('Error al crear paciente', {
            description: result.error,
          })
        }
      } catch (error) {
        console.error('Create patient error:', error)
        toast.error('Error inesperado', {
          description: 'Por favor intenta de nuevo.',
        })
      } finally {
        setIsSubmitting(false)
      }
    },
    [reset, onCreated, onClose]
  )

  const today = startOfDay(new Date())

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">Nuevo Paciente</DialogTitle>
              <DialogDescription>
                Completa la informacion para registrar un nuevo paciente
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          {/* Required Fields Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              <span>Informacion requerida</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Name Field */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <Label htmlFor="name">Nombre completo *</Label>
              </div>
              <Input
                id="name"
                placeholder="Maria Garcia Lopez"
                error={!!errors.name}
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Birth Date and Sex Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Birth Date Field */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-primary" />
                  <Label>Fecha de nacimiento *</Label>
                </div>
                <Controller
                  control={control}
                  name="birthDate"
                  render={({ field }) => (
                    <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal h-11',
                            !field.value && 'text-muted-foreground',
                            errors.birthDate && 'border-destructive'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? (
                            format(field.value, "d 'de' MMMM, yyyy", { locale: es })
                          ) : (
                            <span>Selecciona una fecha</span>
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
                          disabled={(date) => isAfter(startOfDay(date), today)}
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
                {errors.birthDate && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.birthDate.message}
                  </p>
                )}
              </div>

              {/* Sex Field */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <Label>Sexo *</Label>
                </div>
                <Controller
                  control={control}
                  name="sex"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger error={!!errors.sex}>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {SEX_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.sex && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.sex.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Optional Fields Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              <span>Informacion adicional</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Phone and Email Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <Label htmlFor="phone">Telefono</Label>
                </div>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+502 5555 1234"
                  {...register('phone')}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <Label htmlFor="email">Correo electronico</Label>
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="paciente@email.com"
                  error={!!errors.email}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            {/* Address Field */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <Label htmlFor="address">Direccion</Label>
              </div>
              <Input
                id="address"
                placeholder="Zona 10, Ciudad de Guatemala"
                {...register('address')}
              />
            </div>

            {/* Allergies Field */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                <Label htmlFor="allergies">Alergias</Label>
              </div>
              <Textarea
                id="allergies"
                placeholder="Penicilina, mariscos, latex..."
                className="min-h-[80px]"
                {...register('allergies')}
              />
            </div>

            {/* Notes Field */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-primary" />
                <Label htmlFor="notes">Notas</Label>
              </div>
              <Textarea
                id="notes"
                placeholder="Observaciones adicionales del paciente..."
                className="min-h-[80px]"
                {...register('notes')}
              />
            </div>
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
              {isSubmitting ? 'Guardando...' : 'Crear Paciente'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
