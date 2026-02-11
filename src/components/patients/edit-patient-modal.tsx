/**
 * Edit Patient Modal Component
 *
 * Modal for editing patient information including personal data and photo management.
 * Pre-populates form with existing patient data and provides photo upload/delete functionality.
 * Features a clean medical aesthetic with organized sections and smooth transitions.
 *
 * Created: 2026-02-10 - MV2-019 Edit Patient Modal
 */

'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  FileText,
  Heart,
} from 'lucide-react'
import { toast } from 'sonner'

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
import { Separator } from '@/components/ui/separator'
import { PhotoUpload } from '@/components/patients/photo-upload'
import {
  updatePatient,
  uploadPatientPhoto,
  deletePatientPhoto,
} from '@/actions/patients'
import type { Patient, PatientSex } from '@/types/app'

// =============================================================================
// Validation Schema
// =============================================================================

const editPatientSchema = z.object({
  first_name: z.string().min(1, 'El nombre es requerido'),
  last_name: z.string().optional(),
  birth_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  sex: z.enum(['M', 'F', 'O'], { message: 'Seleccione el sexo' }),
  email: z
    .string()
    .email('Correo electrónico inválido')
    .optional()
    .or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  allergies: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})

type EditPatientFormValues = z.infer<typeof editPatientSchema>

// =============================================================================
// Types
// =============================================================================

interface EditPatientModalProps {
  open: boolean
  onClose: () => void
  patient: Patient
  onUpdated?: (patient: Patient) => void
}

// =============================================================================
// Constants
// =============================================================================

const SEX_OPTIONS: { value: PatientSex; label: string }[] = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Femenino' },
  { value: 'O', label: 'Otro' },
]

// =============================================================================
// Component
// =============================================================================

export function EditPatientModal({
  open,
  onClose,
  patient,
  onUpdated,
}: EditPatientModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | null>(patient.photo_url)
  const [isPhotoLoading, setIsPhotoLoading] = useState(false)

  // Form setup
  const form = useForm<EditPatientFormValues>({
    resolver: zodResolver(editPatientSchema),
    defaultValues: {
      first_name: patient.first_name,
      last_name: patient.last_name || '',
      birth_date: patient.birth_date,
      sex: patient.sex,
      email: patient.email || '',
      phone: patient.phone || '',
      address: patient.address || '',
      allergies: patient.allergies || '',
      notes: patient.notes || '',
    },
  })

  // Reset form when patient changes or modal opens
  useEffect(() => {
    if (open) {
      form.reset({
        first_name: patient.first_name,
        last_name: patient.last_name || '',
        birth_date: patient.birth_date,
        sex: patient.sex,
        email: patient.email || '',
        phone: patient.phone || '',
        address: patient.address || '',
        allergies: patient.allergies || '',
        notes: patient.notes || '',
      })
      setPhotoUrl(patient.photo_url)
    }
  }, [open, patient, form])

  // Handle photo upload
  const handlePhotoUpload = async (file: File) => {
    setIsPhotoLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const result = await uploadPatientPhoto(patient.id, formData)

      if (result.success) {
        setPhotoUrl(result.data)
        toast.success('Foto actualizada correctamente')
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      console.error('Error uploading photo:', error)
      toast.error('Error al subir la foto')
    } finally {
      setIsPhotoLoading(false)
    }
  }

  // Handle photo delete
  const handlePhotoDelete = async () => {
    setIsPhotoLoading(true)
    try {
      const result = await deletePatientPhoto(patient.id)

      if (result.success) {
        setPhotoUrl(null)
        toast.success('Foto eliminada correctamente')
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      console.error('Error deleting photo:', error)
      toast.error('Error al eliminar la foto')
    } finally {
      setIsPhotoLoading(false)
    }
  }

  // Handle form submission
  const onSubmit = async (values: EditPatientFormValues) => {
    setIsSubmitting(true)
    try {
      const result = await updatePatient(patient.id, {
        first_name: values.first_name,
        last_name: values.last_name || undefined,
        birth_date: values.birth_date,
        sex: values.sex,
        email: values.email || null,
        phone: values.phone || null,
        address: values.address || null,
        allergies: values.allergies || null,
        notes: values.notes || null,
      })

      if (result.success) {
        toast.success('Paciente actualizado correctamente')
        onUpdated?.(result.data)
        onClose()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      console.error('Error updating patient:', error)
      toast.error('Error al actualizar el paciente')
    } finally {
      setIsSubmitting(false)
    }
  }

  const { errors } = form.formState

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <User className="h-5 w-5 text-primary" />
            Editar paciente
          </DialogTitle>
          <DialogDescription>
            Actualiza la información del paciente. Los campos marcados con * son
            obligatorios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
          {/* Photo Section */}
          <div className="flex flex-col items-center py-4 bg-muted/30 rounded-xl">
            <PhotoUpload
              currentPhotoUrl={photoUrl}
              onUpload={handlePhotoUpload}
              onDelete={handlePhotoDelete}
              isLoading={isPhotoLoading}
              size="lg"
            />
          </div>

          <Separator />

          {/* Personal Information Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              Información personal
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* First Name */}
              <div className="space-y-2">
                <Label htmlFor="first_name" className="text-foreground/80">
                  Nombre *
                </Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="first_name"
                    placeholder="Nombre"
                    className="pl-11"
                    error={!!errors.first_name}
                    {...form.register('first_name')}
                  />
                </div>
                {errors.first_name && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-destructive flex items-center gap-1"
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.first_name.message}
                  </motion.p>
                )}
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <Label htmlFor="last_name" className="text-foreground/80">
                  Apellido
                </Label>
                <Input
                  id="last_name"
                  placeholder="Apellido"
                  error={!!errors.last_name}
                  {...form.register('last_name')}
                />
                {errors.last_name && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-destructive flex items-center gap-1"
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.last_name.message}
                  </motion.p>
                )}
              </div>

              {/* Birth Date */}
              <div className="space-y-2">
                <Label htmlFor="birth_date" className="text-foreground/80">
                  Fecha de nacimiento *
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="birth_date"
                    type="date"
                    className="pl-11"
                    error={!!errors.birth_date}
                    {...form.register('birth_date')}
                  />
                </div>
                {errors.birth_date && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-destructive flex items-center gap-1"
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.birth_date.message}
                  </motion.p>
                )}
              </div>

              {/* Sex */}
              <div className="space-y-2">
                <Label htmlFor="sex" className="text-foreground/80">
                  Sexo *
                </Label>
                <Controller
                  name="sex"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger error={!!errors.sex}>
                        <SelectValue placeholder="Seleccionar sexo" />
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
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-destructive flex items-center gap-1"
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.sex.message}
                  </motion.p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Information Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Información de contacto
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground/80">
                  Correo electrónico
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    className="pl-11"
                    error={!!errors.email}
                    {...form.register('email')}
                  />
                </div>
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-destructive flex items-center gap-1"
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.email.message}
                  </motion.p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-foreground/80">
                  Teléfono
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+502 1234-5678"
                    className="pl-11"
                    error={!!errors.phone}
                    {...form.register('phone')}
                  />
                </div>
                {errors.phone && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-destructive flex items-center gap-1"
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.phone.message}
                  </motion.p>
                )}
              </div>

              {/* Address - Full Width */}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address" className="text-foreground/80">
                  Dirección
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="address"
                    placeholder="Dirección completa"
                    className="pl-11 min-h-[80px]"
                    error={!!errors.address}
                    {...form.register('address')}
                  />
                </div>
                {errors.address && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-destructive flex items-center gap-1"
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.address.message}
                  </motion.p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Medical Information Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Información médica
            </h3>

            <div className="space-y-4">
              {/* Allergies */}
              <div className="space-y-2">
                <Label htmlFor="allergies" className="text-foreground/80">
                  Alergias
                </Label>
                <div className="relative">
                  <AlertCircle className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="allergies"
                    placeholder="Lista de alergias conocidas"
                    className="pl-11 min-h-[80px]"
                    error={!!errors.allergies}
                    {...form.register('allergies')}
                  />
                </div>
                {errors.allergies && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-destructive flex items-center gap-1"
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.allergies.message}
                  </motion.p>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-foreground/80">
                  Notas adicionales
                </Label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="notes"
                    placeholder="Notas o comentarios sobre el paciente"
                    className="pl-11 min-h-[100px]"
                    error={!!errors.notes}
                    {...form.register('notes')}
                  />
                </div>
                {errors.notes && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-destructive flex items-center gap-1"
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.notes.message}
                  </motion.p>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {!isSubmitting && 'Guardar cambios'}
              {isSubmitting && 'Guardando...'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
