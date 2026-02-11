/**
 * Contact Page
 *
 * Public contact page with contact form and support information.
 * Uses the ContactForm component for lead capture and the
 * support section contact methods.
 *
 * Created: 2026-02-10 - MV2-054 Contact Page (QA fix)
 */

'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Stethoscope, Phone, MessageCircle, Mail, ArrowRight, ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ContactForm } from '@/components/landing/contact-form'

// Force dynamic rendering for framer-motion
export const dynamic = 'force-dynamic'

const contactMethods = [
  {
    icon: Phone,
    title: 'Teléfono',
    description: 'Lunes a Viernes, 9am - 6pm',
    value: '+502 2234-5678',
    href: 'tel:+50222345678',
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp',
    description: 'Respuesta rápida',
    value: '+502 5555-1234',
    href: 'https://wa.me/50255551234?text=Hola%2C%20me%20interesa%20MidiMed',
  },
  {
    icon: Mail,
    title: 'Correo electrónico',
    description: 'Soporte técnico',
    value: 'soporte@midimed.io',
    href: 'mailto:soporte@midimed.io',
  },
]

export default function ContactPage() {
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
            <Button variant="outline" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al inicio
              </Link>
            </Button>
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
          className="mb-16 text-center"
        >
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Contáctanos
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Estamos aquí para ayudarte. Completa el formulario o contáctanos
            directamente por el medio que prefieras.
          </p>
        </motion.div>

        {/* Content Grid */}
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex justify-center lg:justify-start"
          >
            <ContactForm />
          </motion.div>

          {/* Contact Methods */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-semibold text-foreground">
              Otras formas de contacto
            </h2>
            <p className="text-muted-foreground">
              También puedes comunicarte con nosotros directamente.
            </p>

            <div className="space-y-4">
              {contactMethods.map((method, index) => (
                <motion.a
                  key={method.title}
                  href={method.href}
                  target={method.href.startsWith('http') ? '_blank' : undefined}
                  rel={method.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                  className="group flex items-center gap-4 rounded-xl border border-border/50 bg-card p-4 transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <method.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{method.title}</h3>
                    <p className="text-sm text-muted-foreground">{method.description}</p>
                    <p className="mt-0.5 text-sm font-medium text-primary">{method.value}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </motion.a>
              ))}
            </div>

            {/* Office Hours */}
            <div className="rounded-xl border border-border/50 bg-muted/30 p-6">
              <h3 className="font-medium text-foreground">Horario de atención</h3>
              <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                <p>Lunes a Viernes: 9:00 AM - 6:00 PM (GMT-6)</p>
                <p>Sábado: 9:00 AM - 1:00 PM</p>
                <p>Domingo: Cerrado</p>
              </div>
            </div>
          </motion.div>
        </div>
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
