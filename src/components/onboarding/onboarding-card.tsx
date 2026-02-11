/**
 * Onboarding Card Component
 *
 * Progress card shown on dashboard for new users completing onboarding.
 * Shows steps, progress bar, and celebrates completion with confetti.
 *
 * Created: 2026-02-10 - MV2-057 Onboarding Tutorial System
 */

'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useOnboarding } from '@/hooks/use-onboarding'
import { OnboardingStep } from './onboarding-step'

interface OnboardingCardProps {
  /** Additional CSS classes */
  className?: string
  /** Callback when card is dismissed */
  onDismiss?: () => void
}

/**
 * Pre-computed confetti particle data to avoid impure function calls during render.
 */
interface ConfettiParticleData {
  id: number
  delay: number
  x: number
  color: string
  size: number
  rotate: number
  xOffset: number
  duration: number
  isCircle: boolean
}

const CONFETTI_COLORS = ['#3abdd4', '#208697', '#fbbf24', '#34d399', '#f472b6', '#a78bfa']

/**
 * Generates confetti particle data outside of render cycle.
 */
function generateConfettiParticles(count: number): ConfettiParticleData[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    delay: Math.random() * 0.3,
    x: (Math.random() - 0.5) * 300,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)] ?? '#3abdd4',
    size: Math.random() * 8 + 4,
    rotate: Math.random() * 720 - 360,
    xOffset: Math.random() * 100 - 50,
    duration: 2 + Math.random(),
    isCircle: Math.random() > 0.5,
  }))
}

/**
 * Confetti particle component for celebration effect.
 */
function ConfettiParticle({ particle }: { particle: ConfettiParticleData }) {
  return (
    <motion.div
      initial={{
        x: particle.x,
        y: -20,
        opacity: 1,
        rotate: 0,
        scale: 1,
      }}
      animate={{
        y: 400,
        opacity: 0,
        rotate: particle.rotate,
        scale: 0.5,
        x: particle.x + particle.xOffset,
      }}
      transition={{
        duration: particle.duration,
        delay: particle.delay,
        ease: 'easeOut',
      }}
      style={{
        position: 'absolute',
        width: particle.size,
        height: particle.size,
        backgroundColor: particle.color,
        borderRadius: particle.isCircle ? '50%' : '2px',
        top: 0,
        left: '50%',
        pointerEvents: 'none',
      }}
    />
  )
}

/**
 * Confetti explosion effect for completion celebration.
 * Particles are pre-generated to avoid impure render calls.
 */
function ConfettiExplosion({ particles }: { particles: ConfettiParticleData[] }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((particle) => (
        <ConfettiParticle key={particle.id} particle={particle} />
      ))}
    </div>
  )
}

/**
 * Main onboarding progress card.
 * Displays steps, tracks progress, and celebrates completion.
 */
export function OnboardingCard({ className, onDismiss }: OnboardingCardProps) {
  const {
    steps,
    completedCount,
    totalSteps,
    progressPercent,
    isComplete,
    isLoading,
  } = useOnboarding()

  const [showConfetti, setShowConfetti] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const hasSeenCompleteRef = useRef(false)
  const prevCompleteRef = useRef(isComplete)

  // Pre-generate confetti particles (stable across renders)
  const confettiParticles = useMemo(() => generateConfettiParticles(50), [])

  // Handle completion celebration
  useEffect(() => {
    // Only trigger confetti when transitioning from incomplete to complete
    if (isComplete && !prevCompleteRef.current && !hasSeenCompleteRef.current) {
      hasSeenCompleteRef.current = true

      // Use requestAnimationFrame to defer state updates
      requestAnimationFrame(() => {
        setShowConfetti(true)
      })

      // Hide confetti after animation
      const confettiTimer = setTimeout(() => {
        setShowConfetti(false)
      }, 3000)

      // Auto-dismiss after 5 seconds
      const dismissTimer = setTimeout(() => {
        setIsDismissed(true)
        onDismiss?.()
      }, 5000)

      return () => {
        clearTimeout(confettiTimer)
        clearTimeout(dismissTimer)
      }
    }

    prevCompleteRef.current = isComplete
  }, [isComplete, onDismiss])

  const handleDismiss = useCallback(() => {
    setIsDismissed(true)
    onDismiss?.()
  }, [onDismiss])

  // Find the first incomplete step (next step to complete)
  const nextStepIndex = steps.findIndex((s) => !s.completed)

  // Don't render if dismissed or still loading with no data
  if (isDismissed || (isLoading && completedCount === 0)) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={cn(
          'relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-lg',
          className
        )}
      >
        {/* Confetti celebration */}
        {showConfetti && <ConfettiExplosion particles={confettiParticles} />}

        {/* Gradient background accent */}
        <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />

        {/* Card content */}
        <div className="relative p-5">
          {/* Header */}
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  {isComplete ? 'Tutorial completado' : 'Primeros pasos'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isComplete
                    ? 'Ya dominas lo basico de MidiMed'
                    : `${completedCount} de ${totalSteps} pasos completados`}
                </p>
              </div>
            </div>

            {/* Dismiss button */}
            {isComplete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={handleDismiss}
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>{progressPercent}% completado</span>
              {!isComplete && nextStepIndex >= 0 && steps[nextStepIndex] && (
                <span className="text-primary">
                  Siguiente: {steps[nextStepIndex].label}
                </span>
              )}
            </div>
          </div>

          {/* Steps list */}
          {!isComplete && (
            <div className="space-y-1">
              {steps.map((step, index) => (
                <OnboardingStep
                  key={step.id}
                  label={step.label}
                  description={step.description}
                  icon={step.icon}
                  completed={step.completed}
                  href={step.href}
                  index={index}
                  isNext={index === nextStepIndex}
                />
              ))}
            </div>
          )}

          {/* Completion message */}
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-gradient-to-br from-primary/10 to-transparent p-4 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.2 }}
                className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20"
              >
                <span className="text-3xl">🎉</span>
              </motion.div>
              <p className="text-sm font-medium text-foreground">
                Excelente trabajo
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Estas listo para usar MidiMed al maximo
              </p>
            </motion.div>
          )}
        </div>

        {/* Bottom decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * Minimal onboarding indicator for compact spaces.
 * Shows just the progress percentage with tooltip.
 */
export function OnboardingIndicator({ className }: { className?: string }) {
  const { progressPercent, isComplete } = useOnboarding()

  if (isComplete) return null

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary',
        className
      )}
    >
      <div className="relative h-1.5 w-16 overflow-hidden rounded-full bg-primary/20">
        <motion.div
          className="absolute inset-y-0 left-0 bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
      <span>{progressPercent}%</span>
    </div>
  )
}
