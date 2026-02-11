/**
 * Login Page
 *
 * Entry point for existing users with email/password and magic link authentication.
 * Features a split-screen layout on desktop with a decorative left panel.
 *
 * Created: 2026-02-10 - MV2-010 Login page UI
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { Activity, Heart, Shield, Clock } from 'lucide-react'

import { LoginForm } from '@/components/auth/login-form'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'Iniciar sesion - MidiMed',
  description: 'Inicia sesion en tu cuenta de MidiMed para administrar tu clinica.',
}

export default function LoginPage() {
  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--background)',
            border: '1px solid var(--border)',
            color: 'var(--foreground)',
          },
        }}
      />

      <div className="min-h-screen flex">
        {/* Left Panel - Decorative (hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary to-primary/90" />

          {/* Subtle pattern overlay */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          {/* Floating decorative shapes */}
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-32 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">
                MidiMed
              </span>
            </Link>

            {/* Main content */}
            <div className="max-w-lg">
              <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
                Gestion medica{' '}
                <span className="text-white/80">simplificada</span>
              </h1>
              <p className="text-lg text-white/70 leading-relaxed mb-12">
                Administra pacientes, citas y expedientes medicos desde una
                plataforma intuitiva disenada para clinicas en Latinoamerica.
              </p>

              {/* Feature list */}
              <div className="grid grid-cols-2 gap-4">
                <FeatureCard
                  icon={<Heart className="h-5 w-5" />}
                  title="Pacientes"
                  description="Expedientes completos"
                />
                <FeatureCard
                  icon={<Clock className="h-5 w-5" />}
                  title="Citas"
                  description="Agenda inteligente"
                />
                <FeatureCard
                  icon={<Shield className="h-5 w-5" />}
                  title="Seguridad"
                  description="Datos protegidos"
                />
                <FeatureCard
                  icon={<Activity className="h-5 w-5" />}
                  title="Reportes"
                  description="Analisis en tiempo real"
                />
              </div>
            </div>

            {/* Footer */}
            <p className="text-sm text-white/50">
              © 2026 MidiMed. Todos los derechos reservados.
            </p>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="flex-1 flex flex-col">
          {/* Mobile header */}
          <div className="lg:hidden p-6 flex items-center justify-between border-b border-border/50">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Activity className="h-4.5 w-4.5 text-primary" />
              </div>
              <span className="text-xl font-bold text-foreground tracking-tight">
                MidiMed
              </span>
            </Link>
          </div>

          {/* Form container */}
          <div className="flex-1 flex items-center justify-center p-6 md:p-12">
            <div className="w-full max-w-md">
              {/* Header */}
              <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  Bienvenido de vuelta
                </h2>
                <p className="text-muted-foreground">
                  Inicia sesion para acceder a tu clinica
                </p>
              </div>

              {/* Login Form */}
              <LoginForm />
            </div>
          </div>

          {/* Mobile footer */}
          <div className="lg:hidden p-6 text-center border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              © 2026 MidiMed. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

// =============================================================================
// Feature Card Component
// =============================================================================

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/15 transition-colors">
      <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center text-white mb-3">
        {icon}
      </div>
      <h3 className="font-semibold text-white mb-0.5">{title}</h3>
      <p className="text-sm text-white/60">{description}</p>
    </div>
  )
}
