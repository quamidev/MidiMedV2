/**
 * Invite Modal Component
 *
 * Modal dialog for inviting new team members with email, display name,
 * and role selection. Shows temporary password with copy functionality
 * after successful invitation.
 *
 * Created: 2026-02-10 - MV2-042 Team Management UI
 */

'use client'

import { useState, useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserPlus,
  Mail,
  User,
  Shield,
  Stethoscope,
  Clipboard,
  AlertCircle,
  Copy,
  Check,
  Key,
} from 'lucide-react'

import { inviteUser } from '@/actions/team'
import type { UserRole } from '@/types/app'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// =============================================================================
// Validation Schema
// =============================================================================

const inviteSchema = z.object({
  email: z.string().email('Correo electronico invalido'),
  displayName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  role: z.enum(['admin', 'provider', 'staff'], { message: 'Selecciona un rol' }),
})

type InviteFormData = z.infer<typeof inviteSchema>

// =============================================================================
// Types & Config
// =============================================================================

interface InviteModalProps {
  open: boolean
  onClose: () => void
  onInvited: () => void
}

interface RoleOption {
  value: UserRole
  label: string
  description: string
  icon: React.ElementType
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    value: 'admin',
    label: 'Administrador',
    description: 'Acceso completo a configuracion y equipo',
    icon: Shield,
  },
  {
    value: 'provider',
    label: 'Proveedor',
    description: 'Puede ver y crear citas y expedientes',
    icon: Stethoscope,
  },
  {
    value: 'staff',
    label: 'Staff',
    description: 'Acceso limitado para tareas administrativas',
    icon: Clipboard,
  },
]

// =============================================================================
// Component
// =============================================================================

export function InviteModal({ open, onClose, onInvited }: InviteModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inviteResult, setInviteResult] = useState<{
    email: string
    tempPassword: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      displayName: '',
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
    setInviteResult(null)
    setCopied(false)
    onClose()
  }, [reset, onClose])

  const handleCopyPassword = useCallback(async () => {
    if (!inviteResult) return

    try {
      await navigator.clipboard.writeText(inviteResult.tempPassword)
      setCopied(true)
      toast.success('Contrasena copiada')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Error al copiar')
    }
  }, [inviteResult])

  const onSubmit = useCallback(
    async (data: InviteFormData) => {
      setIsSubmitting(true)

      try {
        const result = await inviteUser({
          email: data.email,
          displayName: data.displayName,
          role: data.role,
        })

        if (result.success) {
          toast.success('Invitacion enviada', {
            description: `Se ha invitado a ${data.displayName}`,
          })
          setInviteResult({
            email: data.email,
            tempPassword: result.data.tempPassword,
          })
          onInvited()
        } else {
          toast.error('Error al invitar', {
            description: result.error,
          })
        }
      } catch (error) {
        console.error('Invite error:', error)
        toast.error('Error inesperado')
      } finally {
        setIsSubmitting(false)
      }
    },
    [onInvited]
  )

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                {inviteResult ? 'Invitacion creada' : 'Invitar miembro'}
              </DialogTitle>
              <DialogDescription>
                {inviteResult
                  ? 'Comparte las credenciales con el nuevo miembro'
                  : 'Agrega un nuevo miembro a tu equipo'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {inviteResult ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 space-y-4"
            >
              {/* Success State */}
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <Check className="h-5 w-5" />
                  <span className="font-medium">Invitacion enviada</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  El usuario puede iniciar sesion con:
                </p>
              </div>

              {/* Credentials */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Correo</Label>
                  <div className="p-3 rounded-lg bg-muted border border-border font-mono text-sm">
                    {inviteResult.email}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Key className="h-3 w-3" />
                    Contrasena temporal
                  </Label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-3 rounded-lg bg-muted border border-border font-mono text-sm">
                      {inviteResult.tempPassword}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyPassword}
                      className="shrink-0"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                El usuario debera cambiar su contrasena al iniciar sesion por primera vez.
              </p>

              <div className="flex justify-end pt-2">
                <Button onClick={handleClose}>Cerrar</Button>
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleSubmit(onSubmit)}
              className="mt-4 space-y-5"
            >
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="invite-email" className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  Correo electronico *
                </Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="nuevo.usuario@email.com"
                  error={!!errors.email}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="invite-name" className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  Nombre para mostrar *
                </Label>
                <Input
                  id="invite-name"
                  placeholder="Dr. Maria Garcia"
                  error={!!errors.displayName}
                  {...register('displayName')}
                />
                {errors.displayName && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.displayName.message}
                  </p>
                )}
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                  Rol *
                </Label>
                <Controller
                  control={control}
                  name="role"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger error={!!errors.role}>
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map((option) => {
                          const Icon = option.icon
                          return (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                              className="py-3"
                            >
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">{option.label}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {option.description}
                                  </p>
                                </div>
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.role && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.role.message}
                  </p>
                )}
              </div>

              {/* Actions */}
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
                  {isSubmitting ? 'Invitando...' : 'Enviar invitacion'}
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
