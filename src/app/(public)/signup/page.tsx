/**
 * Signup page with multi-step wizard for new user and clinic registration.
 * Creates a new tenant (clinic/organization) and admin user.
 *
 * Created: 2026-02-10 - MV2-011 Signup wizard UI
 */

import Link from 'next/link'
import { Stethoscope } from 'lucide-react'

import { SignupWizard } from '@/components/auth/signup-wizard'

export const metadata = {
  title: 'Crear cuenta - MidiMed',
  description: 'Registra tu clinica en MidiMed y comienza a gestionar tus pacientes y citas medicas.',
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Background pattern */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Header */}
      <header className="py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold tracking-tight">MidiMed</span>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-xl">
          {/* Title section */}
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Crea tu cuenta
            </h1>
            <p className="mt-3 text-muted-foreground text-base sm:text-lg">
              Registra tu clinica y comienza a gestionar tus pacientes con MidiMed
            </p>
          </div>

          {/* Card container */}
          <div className="bg-card border border-border rounded-2xl shadow-xl shadow-black/5 p-6 sm:p-10">
            <SignupWizard />
          </div>

          {/* Footer text */}
          <p className="text-center text-xs text-muted-foreground mt-8 max-w-md mx-auto">
            Al crear una cuenta, aceptas nuestros{' '}
            <Link href="/terminos" className="text-primary hover:underline">
              Terminos de servicio
            </Link>{' '}
            y{' '}
            <Link href="/privacidad" className="text-primary hover:underline">
              Politica de privacidad
            </Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} MidiMed. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
