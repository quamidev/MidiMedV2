/**
 * Value Stripe Component
 *
 * Full-width banner with gradient background and bold value proposition.
 * Features single CTA to drive conversions.
 *
 * Created: 2026-02-10 - MV2-051 Features and Benefits
 */

'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function ValueStripe() {
  return (
    <section className="relative overflow-hidden">
      {/* Main Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary" />

      {/* Animated Background Patterns */}
      <div className="pointer-events-none absolute inset-0">
        {/* Moving Gradient Orbs */}
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-white/10 blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, 40, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-white/10 blur-3xl"
        />

        {/* Subtle Grid */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 md:py-28">
        <div className="flex flex-col items-center text-center">
          {/* Sparkle Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm"
          >
            <Sparkles className="h-4 w-4 text-white" />
            <span className="text-sm font-medium text-white/90">
              Transformación digital para tu clínica
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl"
          >
            Deja de perder tiempo con tareas manuales.{' '}
            <span className="text-white/80">
              Enfocate en lo que realmente importa.
            </span>
          </motion.h2>

          {/* Supporting Text */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 max-w-xl text-lg text-white/80"
          >
            Únete a cientos de profesionales de la salud que ya están
            transformando su práctica con MidiMed.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10"
          >
            <Button
              size="lg"
              variant="secondary"
              asChild
              className="group bg-white px-8 text-primary shadow-xl shadow-black/20 hover:bg-white/90"
            >
              <Link href="/signup">
                Comenzar ahora
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </motion.div>

          {/* Trust Note */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-6 text-sm text-white/60"
          >
            30 días gratis. Sin tarjeta de crédito. Cancela cuando quieras.
          </motion.p>
        </div>
      </div>
    </section>
  )
}
