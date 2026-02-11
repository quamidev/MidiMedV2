/**
 * Contact Form Component
 *
 * Premium contact form with animated transitions and Calendly integration.
 * Features elegant field interactions, loading states, and success animation
 * that reveals a Calendly scheduling embed.
 *
 * Created: 2026-02-10 - MV2-054 Contact Page
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, CheckCircle2, Calendar, Sparkles, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { createLead } from '@/actions/leads'
import { cn } from '@/lib/utils'

// =============================================================================
// Validation Schema
// =============================================================================

const contactFormSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Ingresa un correo electrónico válido'),
  message: z.string().optional(),
})

type ContactFormValues = z.infer<typeof contactFormSchema>

// =============================================================================
// Animation Variants
// =============================================================================

const formContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.3, ease: 'easeInOut' as const },
  },
}

const fieldVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
}

const successVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
}

const successItemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
}

// =============================================================================
// Floating Label Input Component
// =============================================================================

interface FloatingFieldProps {
  id: string
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}

function FloatingField({ id, label, required, error, children }: FloatingFieldProps) {
  return (
    <motion.div variants={fieldVariants} className="group relative">
      <label
        htmlFor={id}
        className={cn(
          'mb-2 flex items-center gap-1 text-sm font-medium transition-colors duration-200',
          error ? 'text-destructive' : 'text-muted-foreground group-focus-within:text-primary'
        )}
      >
        {label}
        {required && <span className="text-primary">*</span>}
      </label>
      {children}
      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -5, height: 0 }}
            className="mt-1.5 text-xs font-medium text-destructive"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// =============================================================================
// Success State Component
// =============================================================================

interface SuccessStateProps {
  userName: string
}

function SuccessState({ userName }: SuccessStateProps) {
  const firstName = userName.split(' ')[0]

  return (
    <motion.div
      variants={successVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center text-center"
    >
      {/* Success Icon */}
      <motion.div
        variants={successItemVariants}
        className="relative mb-6"
      >
        <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/30">
          <CheckCircle2 className="h-10 w-10 text-primary-foreground" strokeWidth={2} />
        </div>
      </motion.div>

      {/* Success Message */}
      <motion.h3
        variants={successItemVariants}
        className="text-2xl font-semibold text-foreground"
      >
        ¡Gracias, {firstName}!
      </motion.h3>

      <motion.p
        variants={successItemVariants}
        className="mt-2 max-w-sm text-muted-foreground"
      >
        Hemos recibido tu mensaje. Nuestro equipo te contactara pronto.
      </motion.p>

      {/* Calendly Section */}
      <motion.div
        variants={successItemVariants}
        className="mt-8 w-full"
      >
        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-b from-muted/30 to-muted/50 p-6">
          {/* Decorative gradient */}
          <div className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative">
            <div className="mb-4 flex items-center justify-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
            </div>

            <h4 className="text-lg font-semibold text-foreground">
              ¿Quieres agendar una demo?
            </h4>
            <p className="mt-1 text-sm text-muted-foreground">
              Agenda una llamada con nuestro equipo para conocer MidiMed en detalle.
            </p>

            {/* Calendly Embed Container */}
            <div className="mt-6 overflow-hidden rounded-xl border border-border/50 bg-background">
              <iframe
                src="https://calendly.com/midimed/demo?hide_gdpr_banner=1&primary_color=3abdd4"
                width="100%"
                height="450"
                frameBorder="0"
                title="Agendar demo con MidiMed"
                className="w-full"
              />
            </div>

            {/* Alternative CTA */}
            <div className="mt-4 flex items-center justify-center">
              <span className="text-xs text-muted-foreground">
                O escribe a{' '}
                <a
                  href="mailto:hola@midimed.io"
                  className="font-medium text-primary underline-offset-4 transition-colors hover:underline"
                >
                  hola@midimed.io
                </a>
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// =============================================================================
// Main Contact Form Component
// =============================================================================

export function ContactForm() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submittedName, setSubmittedName] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      message: '',
    },
  })

  const onSubmit = async (data: ContactFormValues) => {
    try {
      const result = await createLead({
        name: data.name,
        email: data.email,
        message: data.message,
      })

      if (result.success) {
        setSubmittedName(data.name)
        setIsSubmitted(true)
        toast.success('Mensaje enviado correctamente')
      } else {
        toast.error(result.error || 'Error al enviar el mensaje')
      }
    } catch {
      toast.error('Error inesperado. Por favor intenta de nuevo.')
    }
  }

  return (
    <div className="relative w-full max-w-lg">
      {/* Background Decorations */}
      <div className="pointer-events-none absolute -top-10 -left-10 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />

      {/* Form Card */}
      <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-b from-card via-card to-card/95 p-8 shadow-xl shadow-black/5">
        {/* Subtle top highlight */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        <AnimatePresence mode="wait">
          {!isSubmitted ? (
            <motion.form
              key="form"
              variants={formContainerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-5"
            >
              {/* Header */}
              <motion.div variants={fieldVariants} className="mb-6">
                <h2 className="text-2xl font-semibold text-foreground">
                  Contáctanos
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Completa el formulario y te responderemos a la brevedad.
                </p>
              </motion.div>

              {/* Name Field */}
              <FloatingField
                id="name"
                label="Nombre"
                required
                error={errors.name?.message}
              >
                <Input
                  id="name"
                  placeholder="Tu nombre completo"
                  error={!!errors.name}
                  className={cn(
                    'h-12 transition-all duration-200',
                    'focus:shadow-lg focus:shadow-primary/10'
                  )}
                  {...register('name')}
                />
              </FloatingField>

              {/* Email Field */}
              <FloatingField
                id="email"
                label="Correo electrónico"
                required
                error={errors.email?.message}
              >
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@correo.com"
                  error={!!errors.email}
                  className={cn(
                    'h-12 transition-all duration-200',
                    'focus:shadow-lg focus:shadow-primary/10'
                  )}
                  {...register('email')}
                />
              </FloatingField>

              {/* Message Field */}
              <FloatingField
                id="message"
                label="Mensaje"
                error={errors.message?.message}
              >
                <Textarea
                  id="message"
                  placeholder="¿En que podemos ayudarte? (opcional)"
                  rows={4}
                  error={!!errors.message}
                  className={cn(
                    'transition-all duration-200',
                    'focus:shadow-lg focus:shadow-primary/10'
                  )}
                  {...register('message')}
                />
              </FloatingField>

              {/* Submit Button */}
              <motion.div variants={fieldVariants} className="pt-2">
                <Button
                  type="submit"
                  size="lg"
                  isLoading={isSubmitting}
                  className={cn(
                    'group w-full gap-2 shadow-lg shadow-primary/25',
                    'transition-all duration-300',
                    'hover:shadow-xl hover:shadow-primary/30'
                  )}
                >
                  {isSubmitting ? (
                    'Enviando...'
                  ) : (
                    <>
                      Enviar mensaje
                      <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </>
                  )}
                </Button>
              </motion.div>

              {/* Privacy Note */}
              <motion.p
                variants={fieldVariants}
                className="text-center text-xs text-muted-foreground"
              >
                Al enviar, aceptas nuestra{' '}
                <a
                  href="/privacy"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  politica de privacidad
                </a>
              </motion.p>
            </motion.form>
          ) : (
            <SuccessState key="success" userName={submittedName} />
          )}
        </AnimatePresence>
      </div>

      {/* Direct Scheduling Option */}
      {!isSubmitted && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-center"
        >
          <p className="text-sm text-muted-foreground">
            ¿Prefieres agendar directamente?
          </p>
          <a
            href="https://calendly.com/midimed/demo"
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            Agenda una demo
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </a>
        </motion.div>
      )}
    </div>
  )
}
