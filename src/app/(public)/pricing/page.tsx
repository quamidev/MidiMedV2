/**
 * Pricing Page
 *
 * Public page displaying all available plans with pricing in GTQ/USD.
 * Features elegant layout with currency toggle, plan cards, and feature comparison.
 * Supports both authenticated and unauthenticated users with appropriate CTAs.
 *
 * Created: 2026-02-10 - MV2-046 Pricing Page
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Stethoscope } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { CurrencyToggle } from '@/components/billing/currency-toggle'
import { PricingCards, FeatureComparison } from '@/components/billing/pricing-cards'
import { getCurrentPlan } from '@/actions/billing'
import type { BillingPlan } from '@/types/app'

// Force dynamic rendering for framer-motion
export const dynamic = 'force-dynamic'

export default function PricingPage() {
  const [currency, setCurrency] = useState<'GTQ' | 'USD'>('GTQ')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<BillingPlan | undefined>()

  // Check authentication status
  useEffect(() => {
    async function checkAuth() {
      try {
        const result = await getCurrentPlan()
        if (result.success) {
          setIsAuthenticated(true)
          setCurrentPlan(result.data.billing_plan)
        }
      } catch {
        // Not authenticated, that's fine
      }
    }
    checkAuth()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Background Pattern */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 h-[1000px] w-[1000px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 h-[800px] w-[800px] rounded-full bg-primary/3 blur-3xl" />
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

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Button variant="outline" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver al dashboard
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Iniciar sesión</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Crear cuenta</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative mx-auto max-w-7xl px-6 py-16">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Planes y precios
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Elige el plan que mejor se adapte a las necesidades de tu clínica.
            Todos incluyen acceso completo durante el período de prueba.
          </p>

          {/* Currency Toggle */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-8 flex justify-center"
          >
            <CurrencyToggle
              currency={currency}
              onCurrencyChange={setCurrency}
            />
          </motion.div>
        </motion.div>

        {/* Pricing Cards */}
        <PricingCards
          currency={currency}
          isAuthenticated={isAuthenticated}
          currentPlan={currentPlan}
        />

        {/* Feature Comparison */}
        <FeatureComparison />

        {/* FAQ / Support CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-20 text-center"
        >
          <div className="rounded-2xl border border-border bg-card p-8 sm:p-12">
            <h3 className="text-2xl font-semibold text-foreground">
              ¿Tienes preguntas?
            </h3>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">
              Nuestro equipo está listo para ayudarte a elegir el plan perfecto
              para tu clínica.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button variant="outline" asChild>
                <a href="mailto:soporte@midimed.io">Contactar soporte</a>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/signup">Empezar prueba gratis</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-border/50 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              2026 MidiMed. Todos los derechos reservados.
            </p>
            <div className="flex gap-6">
              <Link
                href="/privacy"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacidad
              </Link>
              <Link
                href="/terms"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Terminos
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
