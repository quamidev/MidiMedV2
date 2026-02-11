/**
 * Login Form Component
 *
 * Professional login form with password and magic link authentication modes.
 * Features elegant tab switching, form validation, and loading states.
 *
 * Created: 2026-02-10 - MV2-010 Login page UI
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { signInWithPassword, sendMagicLink } from '@/actions/auth'

// =============================================================================
// Validation Schemas
// =============================================================================

const passwordSchema = z.object({
  email: z.string().email('Correo electronico invalido'),
  password: z.string().min(1, 'La contrasena es requerida'),
})

const magicLinkSchema = z.object({
  email: z.string().email('Correo electronico invalido'),
})

type PasswordFormValues = z.infer<typeof passwordSchema>
type MagicLinkFormValues = z.infer<typeof magicLinkSchema>

// =============================================================================
// Types
// =============================================================================

type AuthMode = 'password' | 'magic-link'

// =============================================================================
// Component
// =============================================================================

export function LoginForm() {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>('password')
  const [isLoading, setIsLoading] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // Magic link form
  const magicLinkForm = useForm<MagicLinkFormValues>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: {
      email: '',
    },
  })

  // Handle password login
  async function onPasswordSubmit(values: PasswordFormValues) {
    setIsLoading(true)
    try {
      const result = await signInWithPassword(values)
      if (result.success) {
        toast.success('Bienvenido de vuelta')
        router.push('/dashboard')
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error('Error al iniciar sesion. Intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle magic link
  async function onMagicLinkSubmit(values: MagicLinkFormValues) {
    setIsLoading(true)
    try {
      const result = await sendMagicLink(values)
      if (result.success) {
        setMagicLinkSent(true)
        toast.success('Enlace enviado a tu correo')
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error('Error al enviar el enlace. Intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  // Switch between modes
  function switchMode(newMode: AuthMode) {
    if (newMode !== mode) {
      setMode(newMode)
      setMagicLinkSent(false)
      passwordForm.reset()
      magicLinkForm.reset()
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Mode Toggle */}
      <div className="relative mb-8">
        <div className="flex rounded-xl bg-secondary/50 p-1.5 backdrop-blur-sm">
          {/* Sliding indicator */}
          <motion.div
            className="absolute top-1.5 bottom-1.5 rounded-lg bg-background shadow-md"
            initial={false}
            animate={{
              left: mode === 'password' ? '6px' : '50%',
              width: 'calc(50% - 9px)',
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />

          <button
            type="button"
            onClick={() => switchMode('password')}
            className={cn(
              'relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors duration-200',
              mode === 'password'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Lock className="h-4 w-4" />
            <span>Contrasena</span>
          </button>

          <button
            type="button"
            onClick={() => switchMode('magic-link')}
            className={cn(
              'relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors duration-200',
              mode === 'magic-link'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Sparkles className="h-4 w-4" />
            <span>Enlace magico</span>
          </button>
        </div>
      </div>

      {/* Form Container */}
      <AnimatePresence mode="wait">
        {mode === 'password' ? (
          <motion.form
            key="password"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
            className="space-y-5"
          >
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground/80">
                Correo electronico
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="doctor@clinica.com"
                  className="pl-11"
                  error={!!passwordForm.formState.errors.email}
                  {...passwordForm.register('email')}
                />
              </div>
              {passwordForm.formState.errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-destructive"
                >
                  {passwordForm.formState.errors.email.message}
                </motion.p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground/80">
                Contrasena
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-11"
                  error={!!passwordForm.formState.errors.password}
                  {...passwordForm.register('password')}
                />
              </div>
              {passwordForm.formState.errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-destructive"
                >
                  {passwordForm.formState.errors.password.message}
                </motion.p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              className="w-full mt-6 group"
              isLoading={isLoading}
            >
              {!isLoading && (
                <>
                  Iniciar sesion
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
              {isLoading && 'Iniciando sesion...'}
            </Button>
          </motion.form>
        ) : (
          <motion.div
            key="magic-link"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <AnimatePresence mode="wait">
              {!magicLinkSent ? (
                <motion.form
                  key="magic-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={magicLinkForm.handleSubmit(onMagicLinkSubmit)}
                  className="space-y-5"
                >
                  {/* Description */}
                  <p className="text-sm text-muted-foreground mb-6">
                    Te enviaremos un enlace de acceso a tu correo. Sin necesidad de contrasena.
                  </p>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="magic-email" className="text-foreground/80">
                      Correo electronico
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                      <Input
                        id="magic-email"
                        type="email"
                        placeholder="doctor@clinica.com"
                        className="pl-11"
                        error={!!magicLinkForm.formState.errors.email}
                        {...magicLinkForm.register('email')}
                      />
                    </div>
                    {magicLinkForm.formState.errors.email && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-destructive"
                      >
                        {magicLinkForm.formState.errors.email.message}
                      </motion.p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full mt-6 group"
                    isLoading={isLoading}
                  >
                    {!isLoading && (
                      <>
                        Enviar enlace
                        <Sparkles className="h-4 w-4 transition-transform group-hover:scale-110" />
                      </>
                    )}
                    {isLoading && 'Enviando enlace...'}
                  </Button>
                </motion.form>
              ) : (
                <motion.div
                  key="magic-success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
                    className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6"
                  >
                    <CheckCircle2 className="h-8 w-8 text-primary" />
                  </motion.div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Revisa tu correo
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Te enviamos un enlace de acceso. Haz clic en el para iniciar sesion.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setMagicLinkSent(false)}
                  >
                    Enviar otro enlace
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sign Up Link */}
      <div className="mt-8 pt-6 border-t border-border/50 text-center">
        <p className="text-sm text-muted-foreground">
          ¿No tienes cuenta?{' '}
          <a
            href="/signup"
            className="font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Crear cuenta
          </a>
        </p>
      </div>
    </div>
  )
}
