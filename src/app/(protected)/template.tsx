/**
 * Protected Routes Template
 *
 * Forces dynamic rendering for all protected routes.
 * This prevents static generation issues with context-dependent components.
 *
 * Created: 2026-02-10 - MV2-013 Protected Layout Shell
 */

// Force dynamic rendering for all protected routes
export const dynamic = 'force-dynamic'

export default function ProtectedTemplate({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
