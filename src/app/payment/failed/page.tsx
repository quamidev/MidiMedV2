/**
 * Payment Failed Page
 *
 * Displays error message when payment fails with retry option.
 * Shows helpful guidance for resolving payment issues.
 *
 * Created: 2026-02-10 - MV2-049 Payment Result Pages
 */

'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  XCircle,
  RefreshCw,
  ArrowLeft,
  CreditCard,
  Stethoscope,
  HelpCircle,
} from 'lucide-react'

import { Button } from '@/components/ui/button'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// =============================================================================
// Page Component
// =============================================================================

export default function PaymentFailedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-red-50/30 dark:to-red-950/10">
      {/* Background Effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 h-[1000px] w-[1000px] rounded-full bg-red-500/5 blur-3xl" />
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
          {/* Error Icon */}
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
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
          </motion.div>

          {/* Message */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-foreground"
          >
            Pago no procesado
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-4 text-lg text-muted-foreground"
          >
            No pudimos procesar tu pago. Por favor, intenta de nuevo o usa otro metodo de pago.
          </motion.p>

          {/* Troubleshooting Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 rounded-xl bg-muted/50 p-5 text-left"
          >
            <h3 className="flex items-center gap-2 font-medium text-foreground">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
              Posibles soluciones
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                Verifica que tu tarjeta tenga fondos suficientes
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                Confirma que los datos de la tarjeta sean correctos
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                Intenta con otro metodo de pago
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                Contacta a tu banco si el problema persiste
              </li>
            </ul>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center"
          >
            <Button asChild size="lg" className="group">
              <Link href="/pricing">
                <RefreshCw className="mr-2 h-4 w-4" />
                Intentar de nuevo
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/settings?tab=billing">
                <CreditCard className="mr-2 h-4 w-4" />
                Cambiar metodo de pago
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

          {/* Support Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 pt-6 border-t border-border"
          >
            <p className="text-sm text-muted-foreground">
              ¿Necesitas ayuda?{' '}
              <a
                href="mailto:soporte@midimed.io"
                className="font-medium text-primary hover:underline"
              >
                Contacta a soporte
              </a>
            </p>
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}
