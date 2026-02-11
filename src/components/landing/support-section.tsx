/**
 * Support Section Component
 *
 * Contact and support information section with phone, WhatsApp,
 * and demo scheduling options.
 *
 * Created: 2026-02-10 - MV2-052 Pricing, Testimonials, FAQ
 */

'use client'

import { motion } from 'framer-motion'
import { Phone, MessageCircle, Calendar, Mail, ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'

const contactMethods = [
  {
    icon: Phone,
    title: 'Teléfono',
    description: 'Lunes a Viernes, 9am - 6pm (Guatemala)',
    value: '+502 2234-5678',
    href: 'tel:+50222345678',
    actionLabel: 'Llamar ahora',
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp',
    description: 'Respuesta rápida en horario laboral',
    value: '+502 5555-1234',
    href: 'https://wa.me/50255551234?text=Hola%2C%20me%20interesa%20MidiMed',
    actionLabel: 'Enviar mensaje',
  },
  {
    icon: Mail,
    title: 'Correo electrónico',
    description: 'Soporte técnico y consultas',
    value: 'soporte@midimed.io',
    href: 'mailto:soporte@midimed.io',
    actionLabel: 'Enviar email',
  },
]

export function SupportSection() {
  return (
    <section id="contacto" className="relative overflow-hidden py-20 md:py-32">
      {/* Background */}
      <div className="absolute inset-0 bg-muted/30" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/4 h-[400px] w-[400px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
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
            Soporte
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            ¿Necesitas ayuda?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Nuestro equipo está listo para ayudarte. Contáctanos por el medio que prefieras.
          </p>
        </motion.div>

        {/* Contact Cards */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 md:mt-16">
          {contactMethods.map((method, index) => (
            <motion.div
              key={method.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className="group"
            >
              <a
                href={method.href}
                target={method.href.startsWith('http') ? '_blank' : undefined}
                rel={method.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="block h-full rounded-2xl border border-border/50 bg-card p-6 shadow-lg transition-all duration-300 hover:border-primary/30 hover:shadow-xl"
              >
                {/* Icon */}
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <method.icon className="h-6 w-6" />
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-foreground">
                  {method.title}
                </h3>

                {/* Description */}
                <p className="mt-1 text-sm text-muted-foreground">
                  {method.description}
                </p>

                {/* Value */}
                <p className="mt-3 font-medium text-foreground">
                  {method.value}
                </p>

                {/* Action */}
                <div className="mt-4 flex items-center text-sm font-medium text-primary">
                  {method.actionLabel}
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </a>
            </motion.div>
          ))}
        </div>

        {/* Demo Scheduling CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex flex-col items-center gap-4 rounded-2xl border border-border/50 bg-card p-6 shadow-lg sm:flex-row sm:p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
              <Calendar className="h-7 w-7 text-primary" />
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-lg font-semibold text-foreground">
                ¿Prefieres una demostración personalizada?
              </h3>
              <p className="mt-1 text-muted-foreground">
                Agenda una llamada de 30 minutos con nuestro equipo.
              </p>
            </div>
            <Button size="lg" className="shadow-lg shadow-primary/25">
              Agendar demo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
