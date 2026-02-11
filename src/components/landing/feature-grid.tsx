/**
 * Feature Grid Component
 *
 * 4-card responsive grid showcasing main product features.
 * Includes icons, titles, descriptions with subtle hover animations.
 *
 * Created: 2026-02-10 - MV2-051 Features and Benefits
 */

'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Calendar, FileText, Brain, BarChart3, ArrowRight } from 'lucide-react'

import { cn } from '@/lib/utils'

const features = [
  {
    icon: Calendar,
    title: 'Agenda inteligente',
    description:
      'Calendario visual con arrastrar y soltar. Vista por dia, semana y mes con recordatorios automaticos.',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    icon: FileText,
    title: 'Expedientes digitales',
    description:
      'Historiales medicos completos con signos vitales, diagnosticos, recetas y campos personalizables.',
    gradient: 'from-emerald-500/20 to-teal-500/20',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    icon: Brain,
    title: 'Asistente con IA',
    description:
      'Resumenes automaticos de pacientes y notas SOAP generadas con inteligencia artificial.',
    gradient: 'from-violet-500/20 to-purple-500/20',
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-600 dark:text-violet-400',
  },
  {
    icon: BarChart3,
    title: 'Reportes y analiticas',
    description:
      'Metricas de productividad, tendencias de citas y exportacion de reportes en PDF.',
    gradient: 'from-amber-500/20 to-orange-500/20',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
}

export function FeatureGrid() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="funciones" className="relative py-20 md:py-32">
      {/* Background Pattern */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-primary/5 to-primary/10 blur-3xl" />
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
            Funcionalidades
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Todo lo que necesitas para tu clinica
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Herramientas poderosas disenadas especificamente para profesionales de la salud
            en Latinoamerica.
          </p>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 md:mt-20"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={cardVariants}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group relative"
            >
              <div
                className={cn(
                  'relative h-full overflow-hidden rounded-2xl border border-border/50 bg-card p-6 transition-all duration-300',
                  'hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5'
                )}
              >
                {/* Gradient Background */}
                <div
                  className={cn(
                    'absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100',
                    `bg-gradient-to-br ${feature.gradient}`
                  )}
                />

                {/* Content */}
                <div className="relative">
                  {/* Icon */}
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className={cn(
                      'mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl',
                      feature.iconBg
                    )}
                  >
                    <feature.icon className={cn('h-6 w-6', feature.iconColor)} />
                  </motion.div>

                  {/* Title */}
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>

                  {/* Learn More Link */}
                  <div className="mt-4 flex items-center text-sm font-medium text-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <span>Saber mas</span>
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>

                {/* Corner Decoration */}
                <div className="absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-gradient-to-br from-primary/10 to-transparent opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
