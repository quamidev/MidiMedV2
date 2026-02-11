/**
 * Benefits Section Component
 *
 * 3 benefit cards showcasing the value proposition of MidiMed.
 * Features animated counters and highlights.
 *
 * Created: 2026-02-10 - MV2-051 Features and Benefits
 */

'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion'
import { Clock, Heart, Award, TrendingDown, Sparkles, Shield } from 'lucide-react'

import { cn } from '@/lib/utils'

interface Benefit {
  icon: React.ElementType
  secondaryIcon: React.ElementType
  title: string
  highlight: string
  highlightSuffix?: string
  description: string
  gradient: string
  iconBg: string
}

const benefits: Benefit[] = [
  {
    icon: Clock,
    secondaryIcon: TrendingDown,
    title: 'Ahorra tiempo',
    highlight: '-40%',
    highlightSuffix: '',
    description: 'en tareas administrativas. Automatiza procesos repetitivos y enfocate en tus pacientes.',
    gradient: 'from-blue-600 to-cyan-500',
    iconBg: 'bg-blue-500/10',
  },
  {
    icon: Heart,
    secondaryIcon: Sparkles,
    title: 'Mejora la atención',
    highlight: '100%',
    highlightSuffix: '',
    description: 'de los historiales disponibles al instante. Toma decisiones informadas con contexto completo.',
    gradient: 'from-rose-600 to-pink-500',
    iconBg: 'bg-rose-500/10',
  },
  {
    icon: Award,
    secondaryIcon: Shield,
    title: 'Profesionaliza tu práctica',
    highlight: '+',
    highlightSuffix: 'confianza',
    description: 'Proyecta una imagen moderna y organizada. Genera PDFs profesionales y comunicaciones claras.',
    gradient: 'from-violet-600 to-purple-500',
    iconBg: 'bg-violet-500/10',
  },
]

function AnimatedNumber({ value, suffix = '' }: { value: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  const [displayValue, setDisplayValue] = useState('0')

  useEffect(() => {
    if (!isInView) return

    // Check if value is a number we can animate
    const numericMatch = value.match(/^([+-]?)(\d+)(.*)$/)

    if (numericMatch) {
      const sign = numericMatch[1] ?? ''
      const targetNum = parseInt(numericMatch[2] ?? '0')
      const extra = numericMatch[3] ?? ''
      let current = 0
      const duration = 1500
      const steps = 30
      const increment = targetNum / steps
      const stepDuration = duration / steps

      const timer = setInterval(() => {
        current += increment
        if (current >= targetNum) {
          current = targetNum
          clearInterval(timer)
        }
        setDisplayValue(`${sign}${Math.round(current)}${extra}`)
      }, stepDuration)

      return () => clearInterval(timer)
    } else {
      setDisplayValue(value)
    }
  }, [isInView, value])

  return (
    <span ref={ref} className="tabular-nums">
      {displayValue}
      {suffix}
    </span>
  )
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
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

export function BenefitsSection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background */}
      <div className="absolute inset-0 bg-muted/30" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 right-1/4 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-[400px] w-[400px] rounded-full bg-primary/5 blur-3xl" />
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
            Beneficios
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            ¿Por que elegir MidiMed?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Miles de profesionales de la salud ya confían en nosotros para gestionar su práctica.
          </p>
        </motion.div>

        {/* Benefits Cards */}
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="mt-16 grid gap-8 md:grid-cols-3 md:mt-20"
        >
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              variants={cardVariants}
              whileHover={{ y: -8 }}
              transition={{ duration: 0.3 }}
              className="group relative"
            >
              <div className="relative h-full overflow-hidden rounded-3xl border border-border/50 bg-card p-8 transition-all duration-300 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10">
                {/* Top Gradient Line */}
                <div
                  className={cn(
                    'absolute top-0 left-0 right-0 h-1 bg-gradient-to-r',
                    benefit.gradient
                  )}
                />

                {/* Icon */}
                <div className="relative mb-6">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: -5 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className={cn(
                      'inline-flex h-16 w-16 items-center justify-center rounded-2xl',
                      benefit.iconBg
                    )}
                  >
                    <benefit.icon
                      className={cn(
                        'h-8 w-8 bg-gradient-to-br bg-clip-text',
                        benefit.gradient
                      )}
                      style={{
                        color: 'transparent',
                        backgroundImage: `linear-gradient(to bottom right, ${benefit.gradient.includes('blue') ? '#2563eb, #06b6d4' : benefit.gradient.includes('rose') ? '#e11d48, #ec4899' : '#7c3aed, #a855f7'})`,
                      }}
                    />
                  </motion.div>
                  <benefit.secondaryIcon
                    className="absolute -right-1 -bottom-1 h-6 w-6 text-muted-foreground/30"
                  />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-foreground">
                  {benefit.title}
                </h3>

                {/* Highlight Number */}
                <div className="mt-4 flex items-baseline gap-1">
                  <span
                    className={cn(
                      'text-5xl font-bold bg-gradient-to-r bg-clip-text text-transparent',
                      benefit.gradient
                    )}
                  >
                    <AnimatedNumber
                      value={benefit.highlight}
                      suffix={benefit.highlightSuffix}
                    />
                  </span>
                </div>

                {/* Description */}
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>

                {/* Hover Decoration */}
                <div
                  className={cn(
                    'absolute -right-12 -bottom-12 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100',
                    `bg-gradient-to-br ${benefit.gradient}`
                  )}
                  style={{ opacity: 0.15 }}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
