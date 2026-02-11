/**
 * Payment Success Page
 *
 * Displays confirmation after successful payment with celebratory confetti
 * animation. Auto-redirects to dashboard after 3 seconds.
 *
 * Created: 2026-02-10 - MV2-049 Payment Result Pages
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircle2, ArrowRight, Sparkles, Stethoscope } from 'lucide-react'

import { Button } from '@/components/ui/button'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// =============================================================================
// Confetti Component
// =============================================================================

interface ConfettiPiece {
  id: number
  x: number
  delay: number
  duration: number
  color: string
  size: number
  rotation: number
  borderRadius: string
}

// Generate confetti pieces once at module level
const CONFETTI_COLORS = [
  '#3abdd4', // primary
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
]

function generateConfettiPieces(): ConfettiPiece[] {
  const pieces: ConfettiPiece[] = []
  for (let i = 0; i < 50; i++) {
    const colorIndex = Math.floor(Math.random() * CONFETTI_COLORS.length)
    pieces.push({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 2,
      color: CONFETTI_COLORS[colorIndex] ?? '#3abdd4',
      size: 8 + Math.random() * 8,
      rotation: Math.random() * 360,
      borderRadius: Math.random() > 0.5 ? '50%' : '2px',
    })
  }
  return pieces
}

function Confetti() {
  // Generate pieces once using useMemo with empty deps to avoid re-generation
  const pieces = useState(() => generateConfettiPieces())[0]

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-50">
      {pieces.map((piece) => (
        <motion.div
          key={piece.id}
          initial={{
            y: -20,
            x: `${piece.x}vw`,
            rotate: piece.rotation,
            opacity: 1,
          }}
          animate={{
            y: '110vh',
            rotate: piece.rotation + 360,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: 'linear',
          }}
          style={{
            position: 'absolute',
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            borderRadius: piece.borderRadius,
          }}
        />
      ))}
    </div>
  )
}

// =============================================================================
// Page Component
// =============================================================================

export default function PaymentSuccessPage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)
  const [showConfetti, setShowConfetti] = useState(true)

  // Auto redirect countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/dashboard')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  // Hide confetti after animation
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 4000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-emerald-50/30 dark:to-emerald-950/10">
      {/* Confetti */}
      {showConfetti && <Confetti />}

      {/* Background Effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 h-[1000px] w-[1000px] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 h-[800px] w-[800px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Stethoscope className="h-5 w-5" />
            </div>
            <span className="text-xl font-semibold text-foreground">MidiMed</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative flex min-h-[calc(100vh-73px)] items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md text-center"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 20,
              delay: 0.2,
            }}
            className="mx-auto mb-8"
          >
            <div className="relative">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle2 className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
              </div>

              {/* Sparkle decorations */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute -top-2 -right-2"
              >
                <Sparkles className="h-6 w-6 text-amber-500" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="absolute -bottom-1 -left-3"
              >
                <Sparkles className="h-5 w-5 text-primary" />
              </motion.div>
            </div>
          </motion.div>

          {/* Message */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-foreground"
          >
            ¡Pago exitoso!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-4 text-lg text-muted-foreground"
          >
            Tu suscripción ha sido activada correctamente. Gracias por confiar en MidiMed.
          </motion.p>

          {/* Countdown */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 rounded-xl bg-muted/50 p-4"
          >
            <p className="text-sm text-muted-foreground">
              Redirigiendo al dashboard en{' '}
              <span className="font-semibold text-foreground">{countdown}</span>{' '}
              segundos...
            </p>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center"
          >
            <Button asChild size="lg" className="group">
              <Link href="/dashboard">
                Ir al dashboard
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/settings?tab=billing">Ver mi suscripción</Link>
            </Button>
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}
