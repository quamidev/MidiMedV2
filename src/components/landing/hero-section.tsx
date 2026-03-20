/**
 * Hero Section Component
 *
 * Compelling hero with animated gradient orbs, floating medical icons,
 * trust statistics strip, and staggered reveal animations.
 *
 * Created: 2026-02-10 - MV2-050 Landing Page Hero
 */

'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Stethoscope,
  Calendar,
  FileText,
  Brain,
  Shield,
  Users,
  Heart,
  Activity,
} from 'lucide-react'

import { Button } from '@/components/ui/button'

const floatingIcons = [
  { Icon: Stethoscope, position: 'top-20 left-[10%]', delay: 0, size: 'h-8 w-8' },
  { Icon: Calendar, position: 'top-32 right-[15%]', delay: 0.2, size: 'h-6 w-6' },
  { Icon: FileText, position: 'top-48 left-[20%]', delay: 0.4, size: 'h-7 w-7' },
  { Icon: Brain, position: 'bottom-40 right-[10%]', delay: 0.6, size: 'h-8 w-8' },
  { Icon: Heart, position: 'bottom-32 left-[5%]', delay: 0.8, size: 'h-5 w-5' },
  { Icon: Activity, position: 'top-40 right-[5%]', delay: 1, size: 'h-6 w-6' },
]

const trustStats = [
  { value: '+500', label: 'consultorios', Icon: Users },
  { value: '10,000+', label: 'citas gestionadas', Icon: Calendar },
  { value: '100%', label: 'datos encriptados', Icon: Shield },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
}

export function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden pt-20 md:pt-24">
      {/* Background Gradient Orbs */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-transparent blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, delay: 0.2, ease: 'easeOut' }}
          className="absolute top-1/3 -left-40 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-primary/15 via-primary/5 to-transparent blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, delay: 0.4, ease: 'easeOut' }}
          className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-gradient-to-t from-primary/10 to-transparent blur-3xl"
        />
      </div>

      {/* Subtle Grid Pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(var(--foreground) 1px, transparent 1px),
                           linear-gradient(90deg, var(--foreground) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Floating Medical Icons */}
      <div className="pointer-events-none absolute inset-0 hidden lg:block">
        {floatingIcons.map(({ Icon, position, delay, size }, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.15, scale: 1 }}
            transition={{
              duration: 0.8,
              delay: delay + 0.5,
              ease: [0.22, 1, 0.36, 1] as const,
            }}
            className={`absolute ${position}`}
          >
            <motion.div
              animate={{
                y: [0, -15, 0],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 6 + index,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="text-primary"
            >
              <Icon className={size} strokeWidth={1.5} />
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center py-12 text-center md:py-20"
        >
          {/* Badge */}
          <motion.div
            variants={itemVariants}
            className="mb-6"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Prueba gratuita de 30 días
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="max-w-4xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Tu clínica organizada,{' '}
            <span className="relative">
              <span className="relative z-10 bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                potenciada con IA
              </span>
              <motion.svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 300 12"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1, delay: 1.2, ease: 'easeOut' }}
              >
                <motion.path
                  d="M2 8 C50 2, 100 10, 150 6 C200 2, 250 10, 298 4"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="text-primary/40"
                  strokeDasharray="1 1"
                />
              </motion.svg>
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={itemVariants}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl md:mt-8"
          >
            La plataforma todo-en-uno para clínicas.
            Agenda citas, gestiona expedientes y genera resúmenes con IA.
            Todo en un solo lugar.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="mt-8 flex flex-col gap-4 sm:flex-row sm:gap-5 md:mt-10"
          >
            <Button
              size="lg"
              asChild
              className="group relative overflow-hidden px-8 shadow-xl shadow-primary/30 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/40"
            >
              <Link href="/signup">
                <span className="relative z-10">Empieza gratis</span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary"
                  initial={{ x: '100%' }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="group border-2"
            >
              <a href="#pricing">
                Ver planes
                <motion.span
                  className="ml-1"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
              </a>
            </Button>
          </motion.div>

          {/* Trust Statistics */}
          <motion.div
            variants={itemVariants}
            className="mt-16 w-full md:mt-20"
          >
            <div className="mx-auto max-w-3xl rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm md:p-8">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-border/50">
                {trustStats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 + index * 0.1 }}
                    className="flex flex-col items-center justify-center px-4"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <stat.Icon className="h-5 w-5 text-primary" />
                      <span className="text-3xl font-bold text-foreground md:text-4xl">
                        {stat.value}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {stat.label}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  )
}
