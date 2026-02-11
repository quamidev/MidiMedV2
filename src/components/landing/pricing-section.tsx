/**
 * Pricing Section Component
 *
 * Wraps the existing PricingCards component for the landing page.
 * Includes section header with currency toggle.
 *
 * Created: 2026-02-10 - MV2-052 Pricing, Testimonials, FAQ
 */

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

import { CurrencyToggle } from '@/components/billing/currency-toggle'
import { PricingCards, FeatureComparison } from '@/components/billing/pricing-cards'

export function PricingSection() {
  const [currency, setCurrency] = useState<'GTQ' | 'USD'>('GTQ')

  return (
    <section id="pricing" className="relative py-20 md:py-32">
      {/* Background Pattern */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 h-[1000px] w-[1000px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-primary/5 via-transparent to-primary/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            Precios
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Planes flexibles para cada clínica
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Elige el plan que mejor se adapte a las necesidades de tu práctica.
            Todos incluyen acceso completo durante el período de prueba.
          </p>

          {/* Currency Toggle */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
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
        <div className="mt-12 md:mt-16">
          <PricingCards
            currency={currency}
            isAuthenticated={false}
            currentPlan={undefined}
          />
        </div>

        {/* Feature Comparison */}
        <FeatureComparison />
      </div>
    </section>
  )
}
