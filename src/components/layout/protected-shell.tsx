/**
 * Protected Shell Component
 *
 * Client component that renders the app shell with responsive sidebar margin.
 * Uses SidebarContext to coordinate sidebar collapse state with main content.
 *
 * Created: 2026-02-10 - MV2-013 Protected Layout Shell
 * Updated: 2026-02-10 - MV2-048 Added Global Billing Banner
 */

'use client'

import { useSidebar } from '@/contexts/sidebar-context'
import { cn } from '@/lib/utils'
import { Sidebar } from '@/components/layout/sidebar'
import { BottomTabs } from '@/components/layout/bottom-tabs'
import { Header } from '@/components/layout/header'
import { GlobalBillingBanner } from '@/components/billing/global-billing-banner'

interface ProtectedShellProps {
  children: React.ReactNode
}

export function ProtectedShell({ children }: ProtectedShellProps) {
  const { collapsed } = useSidebar()

  return (
    <div className="min-h-screen bg-background">
      {/* Global Billing Banner - shows for expired trials and past due */}
      <GlobalBillingBanner />

      {/* Desktop Sidebar - hidden on mobile */}
      <Sidebar />

      {/* Mobile Header - hidden on desktop */}
      <Header />

      {/* Main Content Area */}
      <main
        className={cn(
          // Base styles
          'min-h-screen transition-[margin] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
          // Mobile: Add padding for header and bottom tabs
          'pt-14 pb-24 px-4',
          // Desktop: Reset mobile padding
          'md:pt-0 md:pb-6 md:px-6',
          // Desktop: Dynamic margin based on sidebar state
          collapsed ? 'md:ml-16' : 'md:ml-64'
        )}
      >
        {/* Content wrapper with max width for large screens */}
        <div className="mx-auto max-w-7xl py-6">{children}</div>
      </main>

      {/* Mobile Bottom Tabs - hidden on desktop */}
      <BottomTabs />
    </div>
  )
}
