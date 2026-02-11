/**
 * Feature Sections Component
 *
 * 5 alternating left/right sections with detailed feature explanations
 * and placeholder illustrations. Includes scroll-triggered animations.
 *
 * Created: 2026-02-10 - MV2-051 Features and Benefits
 */

'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import {
  Calendar,
  Users,
  Clock,
  FileText,
  Heart,
  Activity,
  Brain,
  Sparkles,
  BarChart3,
  Download,
  UserPlus,
  Bell,
  Shield,
  Check,
} from 'lucide-react'

import { cn } from '@/lib/utils'

interface FeatureSection {
  id: string
  badge: string
  title: string
  description: string
  features: string[]
  icon: React.ElementType
  gradient: string
  illustration: {
    primary: string
    secondary: string
    accent: string
  }
  reversed?: boolean
}

const sections: FeatureSection[] = [
  {
    id: 'calendario',
    badge: 'Agenda',
    title: 'Calendario intuitivo con arrastrar y soltar',
    description:
      'Organiza las citas de tu clínica con un calendario visual que hace la programación simple y eficiente.',
    features: [
      'Vista diaria, semanal y mensual',
      'Arrastrar y soltar para reprogramar',
      'Código de colores por proveedor',
      'Recordatorios automáticos',
    ],
    icon: Calendar,
    gradient: 'from-blue-600 to-cyan-500',
    illustration: {
      primary: 'from-blue-500/30 to-cyan-500/30',
      secondary: 'from-blue-400/20 to-blue-600/20',
      accent: 'bg-blue-500',
    },
  },
  {
    id: 'expedientes',
    badge: 'Expedientes',
    title: 'Historiales médicos completos y accesibles',
    description:
      'Toda la información de tus pacientes en un solo lugar, organizada y lista cuando la necesites.',
    features: [
      'Signos vitales y mediciones',
      'Historial de consultas',
      'Diagnosticos y tratamientos',
      'Campos personalizables',
    ],
    icon: FileText,
    gradient: 'from-emerald-600 to-teal-500',
    illustration: {
      primary: 'from-emerald-500/30 to-teal-500/30',
      secondary: 'from-emerald-400/20 to-emerald-600/20',
      accent: 'bg-emerald-500',
    },
    reversed: true,
  },
  {
    id: 'ia',
    badge: 'Inteligencia Artificial',
    title: 'Resumenes automaticos con IA',
    description:
      'Genera notas clínicas estructuradas y resúmenes de pacientes en segundos con inteligencia artificial.',
    features: [
      'Notas SOAP automaticas',
      'Resumenes de historial',
      'Lenguaje médico profesional',
      'Ahorra horas de documentación',
    ],
    icon: Brain,
    gradient: 'from-violet-600 to-purple-500',
    illustration: {
      primary: 'from-violet-500/30 to-purple-500/30',
      secondary: 'from-violet-400/20 to-violet-600/20',
      accent: 'bg-violet-500',
    },
  },
  {
    id: 'reportes',
    badge: 'Analíticas',
    title: 'Reportes que impulsan decisiones',
    description:
      'Visualiza el rendimiento de tu práctica con métricas claras y exporta reportes profesionales.',
    features: [
      'KPIs en tiempo real',
      'Tendencias de citas',
      'Pacientes frecuentes',
      'Exportación en PDF',
    ],
    icon: BarChart3,
    gradient: 'from-amber-600 to-orange-500',
    illustration: {
      primary: 'from-amber-500/30 to-orange-500/30',
      secondary: 'from-amber-400/20 to-amber-600/20',
      accent: 'bg-amber-500',
    },
    reversed: true,
  },
  {
    id: 'equipo',
    badge: 'Colaboracion',
    title: 'Trabaja en equipo de forma fluida',
    description:
      'Invita a tu equipo con roles personalizados y mantente sincronizado con notificaciones en tiempo real.',
    features: [
      'Roles: Admin, Proveedor, Staff',
      'Invitaciónes por correo',
      'Notificaciones en vivo',
      'Calendario compartido',
    ],
    icon: Users,
    gradient: 'from-rose-600 to-pink-500',
    illustration: {
      primary: 'from-rose-500/30 to-pink-500/30',
      secondary: 'from-rose-400/20 to-rose-600/20',
      accent: 'bg-rose-500',
    },
  },
]

function FeatureSectionItem({ section, index }: { section: FeatureSection; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <div
      ref={ref}
      className={cn(
        'grid gap-8 items-center lg:gap-16',
        section.reversed ? 'lg:grid-cols-[1fr_1.2fr]' : 'lg:grid-cols-[1.2fr_1fr]'
      )}
    >
      {/* Content */}
      <motion.div
        initial={{ opacity: 0, x: section.reversed ? 40 : -40 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
        className={cn(section.reversed && 'lg:order-2')}
      >
        {/* Badge */}
        <span
          className={cn(
            'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white',
            `bg-gradient-to-r ${section.gradient}`
          )}
        >
          <section.icon className="h-3 w-3" />
          {section.badge}
        </span>

        {/* Title */}
        <h3 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
          {section.title}
        </h3>

        {/* Description */}
        <p className="mt-4 text-lg text-muted-foreground">
          {section.description}
        </p>

        {/* Features List */}
        <ul className="mt-6 space-y-3">
          {section.features.map((feature, i) => (
            <motion.li
              key={feature}
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
              className="flex items-center gap-3"
            >
              <div
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-white',
                  `bg-gradient-to-br ${section.gradient}`
                )}
              >
                <Check className="h-3.5 w-3.5" />
              </div>
              <span className="text-foreground">{feature}</span>
            </motion.li>
          ))}
        </ul>
      </motion.div>

      {/* Illustration Placeholder */}
      <motion.div
        initial={{ opacity: 0, x: section.reversed ? -40 : 40 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] as const }}
        className={cn(section.reversed && 'lg:order-1')}
      >
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border/50 bg-muted/30">
          {/* Gradient Background */}
          <div
            className={cn(
              'absolute inset-0 bg-gradient-to-br',
              section.illustration.primary
            )}
          />

          {/* Grid Pattern */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `linear-gradient(var(--foreground) 1px, transparent 1px),
                               linear-gradient(90deg, var(--foreground) 1px, transparent 1px)`,
              backgroundSize: '30px 30px',
            }}
          />

          {/* Floating Elements */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className={cn(
                'flex h-20 w-20 items-center justify-center rounded-2xl shadow-2xl',
                section.illustration.accent
              )}
            >
              <section.icon className="h-10 w-10 text-white" />
            </motion.div>
          </div>

          {/* Decorative Orbs */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 6, repeat: Infinity }}
            className={cn(
              'absolute -top-20 -right-20 h-40 w-40 rounded-full blur-3xl',
              `bg-gradient-to-br ${section.illustration.secondary}`
            )}
          />
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 5, repeat: Infinity, delay: 1 }}
            className={cn(
              'absolute -bottom-20 -left-20 h-40 w-40 rounded-full blur-3xl',
              `bg-gradient-to-tr ${section.illustration.secondary}`
            )}
          />
        </div>
      </motion.div>
    </div>
  )
}

export function FeatureSections() {
  return (
    <section className="relative py-20 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-24 md:space-y-32">
          {sections.map((section, index) => (
            <FeatureSectionItem
              key={section.id}
              section={section}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
