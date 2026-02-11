/**
 * FAQ Section Component
 *
 * Custom accordion with 6 common questions and smooth expand/collapse animations.
 * No dependency on shadcn accordion - custom implementation.
 *
 * Created: 2026-02-10 - MV2-052 Pricing, Testimonials, FAQ
 */

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, HelpCircle } from 'lucide-react'

import { cn } from '@/lib/utils'

interface FAQItem {
  question: string
  answer: string
}

const faqItems: FAQItem[] = [
  {
    question: '¿Que incluye la prueba gratuita?',
    answer:
      'La prueba gratuita de 30 dias incluye acceso completo a todas las funciones de MidiMed: calendario de citas, gestion de pacientes, expedientes medicos, generacion de PDFs, y resumenes con IA. No necesitas tarjeta de credito para comenzar y puedes cancelar en cualquier momento.',
  },
  {
    question: '¿Puedo migrar mis datos existentes?',
    answer:
      'Si, nuestro equipo de soporte puede ayudarte a migrar datos desde hojas de calculo (Excel, Google Sheets) o desde otros sistemas. El proceso es gratuito para todos los planes pagados y normalmente toma entre 1-3 dias habiles dependiendo del volumen de informacion.',
  },
  {
    question: '¿Es seguro almacenar datos de pacientes?',
    answer:
      'Absolutamente. MidiMed utiliza encriptacion de nivel bancario (AES-256) para todos los datos en reposo y en transito. Cumplimos con las normativas de proteccion de datos de salud y realizamos auditorias de seguridad regularmente. Tus datos de pacientes nunca son compartidos con terceros.',
  },
  {
    question: '¿Cuantos usuarios puedo agregar?',
    answer:
      'Depende del plan: El plan Basico incluye 1 usuario, el plan Profesional permite hasta 5 usuarios, y el plan Empresarial ofrece usuarios ilimitados. Cada usuario adicional puede tener roles diferentes (Admin, Proveedor, o Staff) con permisos especificos.',
  },
  {
    question: '¿Ofrecen soporte tecnico?',
    answer:
      'Si, todos los planes incluyen soporte. El plan Basico tiene soporte por correo electronico con respuesta en 24 horas. El plan Profesional incluye soporte prioritario con respuesta en 4 horas y acceso a chat en vivo. El plan Empresarial cuenta con un gerente de cuenta dedicado y soporte telefonico 24/7.',
  },
  {
    question: '¿Como funciona la facturacion?',
    answer:
      'La facturacion es mensual y se procesa automaticamente. Aceptamos tarjetas de credito y debito (Visa, Mastercard) a traves de Recurrente, una pasarela de pago segura para Latinoamerica. Puedes cambiar de plan o cancelar en cualquier momento desde tu panel de configuracion.',
  },
]

function FAQItemComponent({
  item,
  isOpen,
  onToggle,
  index,
}: {
  item: FAQItem
  isOpen: boolean
  onToggle: () => void
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="border-b border-border/50 last:border-0"
    >
      <button
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 py-6 text-left transition-colors hover:text-primary"
        aria-expanded={isOpen}
      >
        <span className="text-lg font-medium text-foreground">{item.question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors',
            isOpen ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          )}
        >
          {isOpen ? (
            <Minus className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
            className="overflow-hidden"
          >
            <p className="pb-6 pr-12 text-muted-foreground leading-relaxed">
              {item.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="relative py-20 md:py-32">
      {/* Background Pattern */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 right-0 h-[600px] w-[600px] -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <HelpCircle className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Preguntas frecuentes
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Encuentra respuestas a las preguntas mas comunes sobre MidiMed.
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <div className="mt-12 rounded-2xl border border-border/50 bg-card p-6 shadow-lg md:mt-16 md:p-8">
          {faqItems.map((item, index) => (
            <FAQItemComponent
              key={index}
              item={item}
              isOpen={openIndex === index}
              onToggle={() => handleToggle(index)}
              index={index}
            />
          ))}
        </div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 text-center"
        >
          <p className="text-muted-foreground">
            ¿No encuentras lo que buscas?{' '}
            <a
              href="#contacto"
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
            >
              Contacta a nuestro equipo
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
