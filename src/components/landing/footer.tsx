/**
 * Footer Component
 *
 * 4-column layout with navigation links, social icons,
 * and copyright information.
 *
 * Created: 2026-02-10 - MV2-053 Footer and SEO
 */

'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Stethoscope, Twitter, Linkedin, Instagram, Facebook, Heart } from 'lucide-react'

const footerLinks = {
  producto: [
    { label: 'Funciones', href: '/#funciones' },
    { label: 'Precios', href: '/#pricing' },
    { label: 'Integraciones', href: '#' },
    { label: 'Seguridad', href: '#' },
  ],
  recursos: [
    { label: 'Blog', href: '#' },
    { label: 'Guias', href: '#' },
    { label: 'Tutoriales', href: '#' },
    { label: 'API', href: '#' },
  ],
  empresa: [
    { label: 'Nosotros', href: '#' },
    { label: 'Contacto', href: '/#contacto' },
    { label: 'Carreras', href: '#' },
    { label: 'Prensa', href: '#' },
  ],
  legal: [
    { label: 'Privacidad', href: '/privacy' },
    { label: 'Terminos', href: '/terms' },
    { label: 'Cookies', href: '#' },
    { label: 'Licencias', href: '#' },
  ],
}

const socialLinks = [
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Facebook, href: '#', label: 'Facebook' },
]

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative border-t border-border/50 bg-muted/30">
      {/* Main Footer Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-6">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Stethoscope className="h-5 w-5" />
              </div>
              <span className="text-xl font-semibold text-foreground">MidiMed</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground leading-relaxed">
              La plataforma todo-en-uno para gestion de consultorios medicos en Latinoamerica.
              Agenda, expedientes y reportes en un solo lugar.
            </p>

            {/* Social Links */}
            <div className="mt-6 flex gap-3">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Producto
              </h3>
              <ul className="mt-4 space-y-3">
                {footerLinks.producto.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Recursos
              </h3>
              <ul className="mt-4 space-y-3">
                {footerLinks.recursos.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Empresa
              </h3>
              <ul className="mt-4 space-y-3">
                {footerLinks.empresa.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Legal
              </h3>
              <ul className="mt-4 space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border/50">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              &copy; {currentYear} MidiMed. Todos los derechos reservados.
            </p>
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              Hecho con{' '}
              <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />{' '}
              en Guatemala
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
