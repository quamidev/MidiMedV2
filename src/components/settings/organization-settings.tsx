/**
 * Organization Settings Component
 *
 * Admin-only settings for clinic organization profile, working hours,
 * appointment duration, and personal user preferences.
 * Features form validation with Zod and optimistic updates.
 *
 * Created: 2026-02-10 - MV2-040 Settings Page with Tabs
 */

'use client'

import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Clock,
  User,
  Moon,
  Sun,
  RotateCcw,
  Save,
  AlertCircle,
} from 'lucide-react'

import { useUser } from '@/hooks/use-user'
import { useTheme } from '@/contexts/theme-context'
import {
  updateOrganization,
  updateAppointmentDuration,
  updateUserProfile,
  resetOnboarding,
} from '@/actions/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { WorkingHoursForm } from './working-hours-form'

// =============================================================================
// Validation Schemas
// =============================================================================

const organizationSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Correo invalido').nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
})

const personalSchema = z.object({
  displayName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
})

type OrganizationFormData = z.infer<typeof organizationSchema>
type PersonalFormData = z.infer<typeof personalSchema>

// =============================================================================
// Duration Options
// =============================================================================

const DURATION_OPTIONS = [
  { value: '15', label: '15 minutos' },
  { value: '20', label: '20 minutos' },
  { value: '30', label: '30 minutos' },
  { value: '45', label: '45 minutos' },
  { value: '60', label: '1 hora' },
  { value: '90', label: '1.5 horas' },
  { value: '120', label: '2 horas' },
]

// =============================================================================
// Component
// =============================================================================

export function OrganizationSettings() {
  const { user, tenant, refreshUser } = useUser()
  const { theme, toggleTheme } = useTheme()
  const isAdmin = user?.role === 'admin'

  const [savingOrg, setSavingOrg] = useState(false)
  const [savingPersonal, setSavingPersonal] = useState(false)
  const [savingDuration, setSavingDuration] = useState(false)
  const [resettingOnboarding, setResettingOnboarding] = useState(false)

  // Organization form
  const orgForm = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: tenant?.name || '',
      email: tenant?.email || '',
      phone: tenant?.phone || '',
      address: tenant?.address || '',
    },
  })

  // Personal form
  const personalForm = useForm<PersonalFormData>({
    resolver: zodResolver(personalSchema),
    defaultValues: {
      displayName: user?.display_name || '',
    },
  })

  // ==========================================================================
  // Handlers
  // ==========================================================================

  const handleSaveOrganization = useCallback(
    async (data: OrganizationFormData) => {
      setSavingOrg(true)
      try {
        const result = await updateOrganization({
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          address: data.address || null,
        })

        if (result.success) {
          toast.success('Organizacion actualizada')
          await refreshUser()
        } else {
          toast.error(result.error)
        }
      } catch (error) {
        console.error('Save organization error:', error)
        toast.error('Error al guardar')
      } finally {
        setSavingOrg(false)
      }
    },
    [refreshUser]
  )

  const handleSavePersonal = useCallback(
    async (data: PersonalFormData) => {
      setSavingPersonal(true)
      try {
        const result = await updateUserProfile({
          displayName: data.displayName,
        })

        if (result.success) {
          toast.success('Perfil actualizado')
          await refreshUser()
        } else {
          toast.error(result.error)
        }
      } catch (error) {
        console.error('Save personal error:', error)
        toast.error('Error al guardar')
      } finally {
        setSavingPersonal(false)
      }
    },
    [refreshUser]
  )

  const handleDurationChange = useCallback(
    async (value: string) => {
      setSavingDuration(true)
      try {
        const result = await updateAppointmentDuration(parseInt(value, 10))

        if (result.success) {
          toast.success('Duracion actualizada')
          await refreshUser()
        } else {
          toast.error(result.error)
        }
      } catch (error) {
        console.error('Save duration error:', error)
        toast.error('Error al guardar')
      } finally {
        setSavingDuration(false)
      }
    },
    [refreshUser]
  )

  const handleResetOnboarding = useCallback(async () => {
    setResettingOnboarding(true)
    try {
      const result = await resetOnboarding()

      if (result.success) {
        toast.success('Tutorial reiniciado', {
          description: 'Vuelve al dashboard para ver el tutorial.',
        })
        await refreshUser()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      console.error('Reset onboarding error:', error)
      toast.error('Error al reiniciar')
    } finally {
      setResettingOnboarding(false)
    }
  }, [refreshUser])

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <div className="space-y-8">
      {/* Organization Profile - Admin Only */}
      {isAdmin && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl border border-border bg-card overflow-hidden"
        >
          <div className="border-b border-border bg-muted/30 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Organizacion</h2>
                <p className="text-xs text-muted-foreground">
                  Informacion de tu clinica
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={orgForm.handleSubmit(handleSaveOrganization)}
            className="p-6 space-y-5"
          >
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="org-name" className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                Nombre de la clinica *
              </Label>
              <Input
                id="org-name"
                placeholder="Clinica MediSalud"
                error={!!orgForm.formState.errors.name}
                {...orgForm.register('name')}
              />
              {orgForm.formState.errors.name && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {orgForm.formState.errors.name.message}
                </p>
              )}
            </div>

            {/* Email and Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="org-email" className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  Correo electronico
                </Label>
                <Input
                  id="org-email"
                  type="email"
                  placeholder="contacto@clinica.com"
                  error={!!orgForm.formState.errors.email}
                  {...orgForm.register('email')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-phone" className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  Telefono
                </Label>
                <Input
                  id="org-phone"
                  type="tel"
                  placeholder="+502 2222 3333"
                  {...orgForm.register('phone')}
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="org-address" className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                Direccion
              </Label>
              <Input
                id="org-address"
                placeholder="Zona 10, Ciudad de Guatemala"
                {...orgForm.register('address')}
              />
            </div>

            {/* Appointment Duration */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                Duracion predeterminada de citas
              </Label>
              <Select
                value={String(tenant?.appointment_duration_minutes || 30)}
                onValueChange={handleDurationChange}
                disabled={savingDuration}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Esta duracion se aplicara a nuevas citas por defecto
              </p>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                isLoading={savingOrg}
                disabled={savingOrg || !orgForm.formState.isDirty}
              >
                <Save className="h-4 w-4 mr-2" />
                Guardar cambios
              </Button>
            </div>
          </form>
        </motion.section>
      )}

      {/* Working Hours - Admin Only */}
      {isAdmin && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <WorkingHoursForm />
        </motion.section>
      )}

      {/* Personal Settings */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: isAdmin ? 0.2 : 0 }}
        className="rounded-2xl border border-border bg-card overflow-hidden"
      >
        <div className="border-b border-border bg-muted/30 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Perfil personal</h2>
              <p className="text-xs text-muted-foreground">
                Tu informacion y preferencias
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Display Name */}
          <form
            onSubmit={personalForm.handleSubmit(handleSavePersonal)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="display-name" className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                Nombre para mostrar
              </Label>
              <div className="flex gap-3">
                <Input
                  id="display-name"
                  placeholder="Dr. Juan Perez"
                  className="flex-1"
                  error={!!personalForm.formState.errors.displayName}
                  {...personalForm.register('displayName')}
                />
                <Button
                  type="submit"
                  variant="outline"
                  isLoading={savingPersonal}
                  disabled={savingPersonal || !personalForm.formState.isDirty}
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
              {personalForm.formState.errors.displayName && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {personalForm.formState.errors.displayName.message}
                </p>
              )}
            </div>
          </form>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
                {theme === 'dark' ? (
                  <Moon className="h-4 w-4 text-foreground" />
                ) : (
                  <Sun className="h-4 w-4 text-foreground" />
                )}
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">
                  Modo oscuro
                </p>
                <p className="text-xs text-muted-foreground">
                  {theme === 'dark' ? 'Activado' : 'Desactivado'}
                </p>
              </div>
            </div>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={toggleTheme}
            />
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Reset Onboarding */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
                <RotateCcw className="h-4 w-4 text-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">
                  Reiniciar tutorial
                </p>
                <p className="text-xs text-muted-foreground">
                  Volver a ver la guia de inicio
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetOnboarding}
              isLoading={resettingOnboarding}
              disabled={resettingOnboarding}
            >
              Reiniciar
            </Button>
          </div>
        </div>
      </motion.section>
    </div>
  )
}
