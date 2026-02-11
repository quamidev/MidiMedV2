/**
 * Landing page placeholder for MidiMed v2.
 * This is a temporary page that will be replaced with the actual landing page.
 *
 * Created: 2026-02-10 - Initial setup
 */

import { cn } from '@/lib/utils'

export default function Home() {
  return (
    <div
      className={cn(
        'flex min-h-screen flex-col items-center justify-center',
        'bg-background text-foreground'
      )}
    >
      <main className="flex flex-col items-center gap-8 px-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary">
          MidiMed v2
        </h1>
        <p className="max-w-md text-lg text-muted-foreground">
          Sistema de gestion medica para clinicas en Latinoamerica.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <h2 className="font-semibold">Estado del proyecto</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Scaffolding completado. Listo para desarrollo.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
