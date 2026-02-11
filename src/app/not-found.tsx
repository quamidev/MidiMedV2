/**
 * Not Found Page
 *
 * Displayed when a page is not found (404).
 *
 * Created: 2026-02-10 - MV2-013 Protected Layout Shell
 */

import Link from 'next/link'

// Force dynamic rendering to avoid prerender issues
export const dynamic = 'force-dynamic'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="text-center">
        <h1 className="mb-2 text-6xl font-bold text-primary">404</h1>
        <h2 className="mb-2 text-2xl font-semibold text-foreground">
          Pagina no encontrada
        </h2>
        <p className="mb-6 text-muted-foreground">
          La pagina que buscas no existe o ha sido movida.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
