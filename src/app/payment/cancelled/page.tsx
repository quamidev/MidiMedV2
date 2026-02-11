/**
 * Payment Cancelled Page
 *
 * Displays message when user cancels checkout process.
 * Provides options to return to settings or try again.
 *
 * Created: 2026-02-10 - MV2-049 Payment Result Pages
 */

'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  CircleSlash,
  ArrowLeft,
  Settings,
  CreditCard,
  Stethoscope,
} from 'lucide-react'

import { Button } from '@/components/ui/button'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// =============================================================================
// Page Component
// =============================================================================

export default function PaymentCancelledPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Background Effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 h-[1000px] w-[1000px] rounded-full bg-muted/20 blur-3xl" />
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
          {/* Icon */}
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
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-muted">
              <CircleSlash className="h-12 w-12 text-muted-foreground" />
            </div>
          </motion.div>

          {/* Message */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-foreground"
          >
            Pago cancelado
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-4 text-lg text-muted-foreground"
          >
            No te preocupes, no se realizo ningun cargo. Puedes intentar de nuevo cuando quieras.
          </motion.p>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 rounded-xl bg-muted/50 p-5"
          >
            <p className="text-sm text-muted-foreground">
              Tu cuenta sigue activa con el plan actual. Puedes cambiar de plan en cualquier momento desde la configuración.
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
              <Link href="/settings?tab=billing">
                <Settings className="mr-2 h-4 w-4" />
                Ir a configuración
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/pricing">
                <CreditCard className="mr-2 h-4 w-4" />
                Ver planes
              </Link>
            </Button>
          </motion.div>

          {/* Back link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-6"
          >
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al dashboard
            </Link>
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}
