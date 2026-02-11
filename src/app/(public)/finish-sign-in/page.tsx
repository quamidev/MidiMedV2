/**
 * Magic Link Verification Page
 *
 * Handles the redirect from magic link emails. Extracts token from URL,
 * verifies with Supabase, shows loading/error states, and redirects on success.
 *
 * Created: 2026-02-10 - MV2-012 Magic link completion page
 */

'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

type VerificationState = 'verifying' | 'success' | 'error'

/**
 * Inner component that handles verification logic.
 * Separated to allow Suspense boundary for useSearchParams.
 */
function FinishSignInContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [state, setState] = useState<VerificationState>('verifying')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    const verifyMagicLink = async () => {
      const tokenHash = searchParams.get('token_hash')
      const type = searchParams.get('type')

      // Validate required params
      if (!tokenHash || !type) {
        setState('error')
        setErrorMessage('Enlace invalido. Por favor solicita un nuevo enlace de acceso.')
        return
      }

      // Only accept magiclink or email type
      if (type !== 'magiclink' && type !== 'email') {
        setState('error')
        setErrorMessage('Tipo de enlace no soportado.')
        return
      }

      try {
        const supabase = createClient()

        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as 'magiclink' | 'email',
        })

        if (error) {
          console.error('Magic link verification error:', error)
          setState('error')

          // User-friendly error messages in Spanish
          if (error.message.includes('expired')) {
            setErrorMessage('El enlace ha expirado. Por favor solicita uno nuevo.')
          } else if (error.message.includes('invalid')) {
            setErrorMessage('El enlace es invalido. Por favor solicita uno nuevo.')
          } else {
            setErrorMessage('Error al verificar el enlace. Por favor intenta de nuevo.')
          }
          return
        }

        // Success - brief pause to show success state before redirect
        setState('success')
        setTimeout(() => {
          router.push('/dashboard')
        }, 800)
      } catch (err) {
        console.error('Unexpected verification error:', err)
        setState('error')
        setErrorMessage('Error inesperado. Por favor intenta de nuevo.')
      }
    }

    verifyMagicLink()
  }, [searchParams, router])

  return (
    <div
      className={cn(
        'relative min-h-screen w-full overflow-hidden',
        'bg-gradient-to-br from-background via-background to-primary/5',
        'dark:from-background dark:via-background dark:to-primary/10'
      )}
    >
      {/* Subtle background pattern */}
      <div
        className={cn(
          'absolute inset-0 opacity-[0.015] dark:opacity-[0.03]',
          'bg-[radial-gradient(circle_at_1px_1px,currentColor_1px,transparent_0)]',
          'bg-[length:24px_24px]'
        )}
      />

      {/* Floating accent orbs for depth */}
      <motion.div
        className={cn(
          'absolute -top-32 -right-32 h-96 w-96 rounded-full',
          'bg-primary/10 blur-3xl dark:bg-primary/20'
        )}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className={cn(
          'absolute -bottom-32 -left-32 h-80 w-80 rounded-full',
          'bg-primary/5 blur-3xl dark:bg-primary/15'
        )}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
      />

      {/* Main content */}
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4">
        <AnimatePresence mode="wait">
          {state === 'verifying' && (
            <motion.div
              key="verifying"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center"
            >
              {/* Animated loader */}
              <div className="relative mb-8">
                {/* Outer pulse ring */}
                <motion.div
                  className={cn(
                    'absolute inset-0 rounded-full',
                    'border-2 border-primary/30'
                  )}
                  animate={{
                    scale: [1, 1.4, 1.4],
                    opacity: [0.6, 0, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                  style={{ width: 80, height: 80 }}
                />

                {/* Inner spinning ring */}
                <motion.div
                  className={cn(
                    'relative flex h-20 w-20 items-center justify-center',
                    'rounded-full border-2 border-muted'
                  )}
                  style={{
                    borderTopColor: 'var(--primary)',
                  }}
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />

                {/* Center dot */}
                <motion.div
                  className={cn(
                    'absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2',
                    'rounded-full bg-primary'
                  )}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.8, 1, 0.8],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              </div>

              {/* Loading text */}
              <motion.h1
                className={cn(
                  'text-xl font-medium tracking-tight text-foreground',
                  'md:text-2xl'
                )}
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                Verificando tu enlace...
              </motion.h1>

              <p className="mt-3 text-sm text-muted-foreground">
                Un momento por favor
              </p>
            </motion.div>
          )}

          {state === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center"
            >
              {/* Success checkmark */}
              <motion.div
                className={cn(
                  'mb-6 flex h-20 w-20 items-center justify-center',
                  'rounded-full bg-primary/10 dark:bg-primary/20'
                )}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 15,
                  delay: 0.1,
                }}
              >
                <motion.svg
                  className="h-10 w-10 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <motion.path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                  />
                </motion.svg>
              </motion.div>

              <h1 className="text-xl font-medium tracking-tight text-foreground md:text-2xl">
                Acceso verificado
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Redirigiendo al dashboard...
              </p>
            </motion.div>
          )}

          {state === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex max-w-sm flex-col items-center text-center"
            >
              {/* Error icon */}
              <motion.div
                className={cn(
                  'mb-6 flex h-20 w-20 items-center justify-center',
                  'rounded-full bg-destructive/10 dark:bg-destructive/20'
                )}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 15,
                }}
              >
                <svg
                  className="h-10 w-10 text-destructive"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </motion.div>

              <h1 className="text-xl font-medium tracking-tight text-foreground md:text-2xl">
                No pudimos verificar tu enlace
              </h1>

              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {errorMessage}
              </p>

              {/* Action button */}
              <motion.button
                onClick={() => router.push('/login')}
                className={cn(
                  'mt-8 inline-flex items-center justify-center gap-2',
                  'rounded-lg bg-primary px-6 py-3',
                  'text-sm font-medium text-primary-foreground',
                  'shadow-sm transition-all duration-200',
                  'hover:bg-primary/90 hover:shadow-md',
                  'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2',
                  'dark:focus:ring-offset-background'
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Volver al inicio de sesion
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Brand footer */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <p className="text-xs text-muted-foreground/60">
            MidiMed
          </p>
        </motion.div>
      </div>
    </div>
  )
}

/**
 * Magic Link Verification Page
 *
 * Wraps the content in a Suspense boundary to handle useSearchParams
 * which requires client-side rendering.
 */
export default function FinishSignInPage() {
  return (
    <Suspense
      fallback={
        <div
          className={cn(
            'flex min-h-screen items-center justify-center',
            'bg-background text-foreground'
          )}
        >
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'h-8 w-8 animate-spin rounded-full',
                'border-2 border-muted border-t-primary'
              )}
            />
            <p className="mt-4 text-sm text-muted-foreground">
              Cargando...
            </p>
          </div>
        </div>
      }
    >
      <FinishSignInContent />
    </Suspense>
  )
}
