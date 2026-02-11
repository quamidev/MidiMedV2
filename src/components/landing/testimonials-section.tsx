/**
 * Testimonials Section Component
 *
 * 3 doctor testimonials with card-based layout.
 * Carousel on mobile, grid on desktop with subtle shadows.
 *
 * Created: 2026-02-10 - MV2-052 Pricing, Testimonials, FAQ
 */

'use client'

import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Quote, Star, ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface Testimonial {
  quote: string
  name: string
  specialty: string
  clinic: string
  initials: string
  rating: number
}

const testimonials: Testimonial[] = [
  {
    quote:
      'MidiMed ha transformado completamente la forma en que manejo mi consultorio. Antes pasaba horas en papeles, ahora todo esta organizado y a un clic de distancia. Mis pacientes notan la diferencia.',
    name: 'Dra. Maria Elena Gonzalez',
    specialty: 'Medicina General',
    clinic: 'Clinica Santa Fe',
    initials: 'MG',
    rating: 5,
  },
  {
    quote:
      'La funcion de resumenes con IA me ahorra al menos una hora diaria en documentacion. Es como tener un asistente que entiende el lenguaje medico. Increiblemente util para un pediatra ocupado.',
    name: 'Dr. Carlos Mendoza',
    specialty: 'Pediatria',
    clinic: 'Centro Medico Los Alamos',
    initials: 'CM',
    rating: 5,
  },
  {
    quote:
      'Por fin una plataforma pensada para clinicas latinoamericanas. El soporte en espanol, los precios accesibles y la facilidad de uso hacen que valga cada quetzal invertido.',
    name: 'Dra. Ana Patricia Rodriguez',
    specialty: 'Ginecologia',
    clinic: 'Hospital Privado del Sur',
    initials: 'AR',
    rating: 5,
  },
]

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

function TestimonialCard({ testimonial, index }: { testimonial: Testimonial; index: number }) {
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="relative h-full"
    >
      <div className="relative h-full overflow-hidden rounded-2xl border border-border/50 bg-card p-6 shadow-lg transition-all duration-300 hover:border-primary/20 hover:shadow-xl md:p-8">
        {/* Quote Icon */}
        <div className="absolute -top-4 -left-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Quote className="h-6 w-6 text-primary" />
        </div>

        {/* Rating Stars */}
        <div className="mb-4 flex gap-1 pt-4">
          {Array.from({ length: testimonial.rating }).map((_, i) => (
            <Star
              key={i}
              className="h-4 w-4 fill-amber-400 text-amber-400"
            />
          ))}
        </div>

        {/* Quote Text */}
        <blockquote className="text-foreground leading-relaxed">
          &ldquo;{testimonial.quote}&rdquo;
        </blockquote>

        {/* Author */}
        <div className="mt-6 flex items-center gap-4 border-t border-border/50 pt-6">
          {/* Avatar */}
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-sm font-semibold text-primary-foreground">
            {testimonial.initials}
          </div>
          {/* Details */}
          <div>
            <div className="font-semibold text-foreground">
              {testimonial.name}
            </div>
            <div className="text-sm text-muted-foreground">
              {testimonial.specialty}
            </div>
            <div className="text-xs text-muted-foreground/70">
              {testimonial.clinic}
            </div>
          </div>
        </div>

        {/* Decorative Corner */}
        <div className="absolute -right-8 -bottom-8 h-24 w-24 rounded-full bg-primary/5 blur-2xl" />
      </div>
    </motion.div>
  )
}

export function TestimonialsSection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [activeIndex, setActiveIndex] = useState(0)

  const handlePrevious = () => {
    setActiveIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setActiveIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1))
  }

  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background */}
      <div className="absolute inset-0 bg-muted/30" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-0 h-[400px] w-[400px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-0 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
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
            Testimonios
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Lo que dicen nuestros usuarios
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Medicos de toda Latinoamerica confian en MidiMed para gestionar su practica.
          </p>
        </motion.div>

        {/* Desktop Grid */}
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="mt-16 hidden gap-8 md:grid md:grid-cols-3"
        >
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={testimonial.name}
              testimonial={testimonial}
              index={index}
            />
          ))}
        </motion.div>

        {/* Mobile Carousel */}
        <div className="mt-12 md:hidden">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <TestimonialCard
              testimonial={testimonials[activeIndex]!}
              index={activeIndex}
            />
          </motion.div>

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevious}
              className="h-10 w-10 rounded-full"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            {/* Dots */}
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    'h-2 w-2 rounded-full transition-all duration-300',
                    index === activeIndex
                      ? 'w-6 bg-primary'
                      : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  )}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              className="h-10 w-10 rounded-full"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
