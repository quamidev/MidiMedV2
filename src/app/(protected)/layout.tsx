/**
 * Protected Layout - Authenticated App Shell
 *
 * Main layout wrapper for all authenticated routes with:
 * - Desktop: Collapsible sidebar (256px expanded / 64px collapsed)
 * - Mobile: Fixed bottom tabs + top header
 * - UserProvider wrapper for auth context
 * - ThemeProvider for dark mode support
 * - SidebarProvider for sidebar state coordination
 * - Responsive content area with proper margins
 *
 * Created: 2026-02-10 - MV2-013 Protected Layout Shell
 */

import { UserProvider } from '@/contexts/user-context'
import { ThemeProvider } from '@/contexts/theme-context'
import { SidebarProvider } from '@/contexts/sidebar-context'
import { ProtectedShell } from '@/components/layout/protected-shell'

// Force dynamic rendering for all protected routes
// This is required because the layout uses client-side context providers
export const dynamic = 'force-dynamic'

interface ProtectedLayoutProps {
  children: React.ReactNode
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return (
    <ThemeProvider>
      <UserProvider>
        <SidebarProvider>
          <ProtectedShell>{children}</ProtectedShell>
        </SidebarProvider>
      </UserProvider>
    </ThemeProvider>
  )
}
