/**
 * Footer Component
 *
 * Minimal footer with MidiMed branding, product links,
 * copyright, and Quami studio credit.
 *
 * Created: 2026-02-10 - MV2-053 Footer and SEO
 * Updated: 2026-02-10 - Simplified footer, removed placeholder links, added Quami credit
 */

'use client'

import Link from 'next/link'
import { Heart } from 'lucide-react'
import { MidimedLogo } from '@/components/ui/midimed-logo'

const footerLinks = [
  { label: 'Funciones', href: '/#funciones' },
  { label: 'Precios', href: '/#pricing' },
  { label: 'Contacto', href: '/#contacto' },
  { label: 'Privacidad', href: '/privacy' },
  { label: 'Términos', href: '/terms' },
]

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative border-t border-border/50 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-8">
          {/* Brand */}
          <Link href="/" className="inline-flex items-center gap-2">
            <MidimedLogo variant="primary" size={36} />
            <span className="text-xl font-semibold text-foreground">MidiMed</span>
          </Link>

          {/* Description */}
          <p className="max-w-md text-center text-sm text-muted-foreground leading-relaxed">
            La plataforma todo-en-uno para gestión de consultorios médicos.
            Agenda, expedientes y reportes en un solo lugar.
          </p>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border/50">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              &copy; {currentYear} quami. Todos los derechos reservados.
            </p>
            <div className="flex flex-col items-center gap-2 sm:items-end">
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                Hecho con{' '}
                <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />{' '}
                en Guatemala por{' '}
                <a
                  href="https://quami.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-medium text-foreground transition-colors hover:text-primary"
                >
                  <img src="/quami-logo.svg" alt="Quami" width={18} height={18} className="rounded" />
                  quami
                </a>
              </p>
              {/* Quami zigzag accent */}
              <svg viewBox="0 0 300 8" fill="none" className="w-full" preserveAspectRatio="none">
                <path
                  d="M2,6 L60,6 L105,2 L150,6 L195,2 L240,6 L298,6"
                  stroke="#F5D547"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
