/**
 * Settings Tabs Component
 *
 * Main tabbed navigation for the settings page with role-based visibility.
 * Admins see all tabs, other roles see limited options.
 * Features refined medical clinic aesthetic with smooth transitions.
 *
 * Created: 2026-02-10 - MV2-040 Settings Page with Tabs
 * Updated: 2026-02-10 - MV2-047 Added Billing Settings tab
 */

'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  Users,
  FileText,
  CreditCard,
  Settings,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { useUser } from '@/hooks/use-user'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { OrganizationSettings } from './organization-settings'
import { TeamSettings } from './team-settings'
import { CustomFieldsSettings } from './custom-fields-settings'
import { BillingSettings } from './billing-settings'

// =============================================================================
// Tab Configuration
// =============================================================================

interface TabConfig {
  id: string
  label: string
  icon: React.ElementType
  adminOnly: boolean
}

const TABS: TabConfig[] = [
  { id: 'organization', label: 'Organizacion', icon: Building2, adminOnly: false },
  { id: 'team', label: 'Usuarios', icon: Users, adminOnly: true },
  { id: 'forms', label: 'Formularios', icon: FileText, adminOnly: true },
  { id: 'billing', label: 'Planes', icon: CreditCard, adminOnly: true },
]

// =============================================================================
// Component
// =============================================================================

export function SettingsTabs() {
  const { user, tenant, loading } = useUser()
  const [activeTab, setActiveTab] = useState('organization')

  const isAdmin = user?.role === 'admin'

  // Filter tabs based on user role
  const visibleTabs = useMemo(
    () => TABS.filter((tab) => !tab.adminOnly || isAdmin),
    [isAdmin]
  )

  if (loading) {
    return <SettingsTabsSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-4"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-sm">
          <Settings className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Configuracion
          </h1>
          <p className="text-sm text-muted-foreground">
            {tenant?.name || 'Tu clinica'}
          </p>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Mobile: Scrollable tabs */}
        <div className="overflow-x-auto -mx-2 px-2 pb-2 md:overflow-visible md:mx-0 md:px-0 md:pb-0">
          <TabsList className="w-max md:w-auto">
            {visibleTabs.map((tab, index) => {
              const Icon = tab.icon
              return (
                <motion.div
                  key={tab.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <TabsTrigger
                    value={tab.id}
                    className={cn(
                      'gap-2 min-w-[120px] md:min-w-0',
                      activeTab === tab.id && 'shadow-sm'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.slice(0, 4)}.</span>
                  </TabsTrigger>
                </motion.div>
              )
            })}
          </TabsList>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <TabsContent value="organization" className="mt-6">
            <motion.div
              key="organization"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <OrganizationSettings />
            </motion.div>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="team" className="mt-6">
              <motion.div
                key="team"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <TeamSettings />
              </motion.div>
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="forms" className="mt-6">
              <motion.div
                key="forms"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <CustomFieldsSettings />
              </motion.div>
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="billing" className="mt-6">
              <motion.div
                key="billing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <BillingSettings />
              </motion.div>
            </TabsContent>
          )}
        </AnimatePresence>
      </Tabs>
    </div>
  )
}

// =============================================================================
// Skeleton Loader
// =============================================================================

function SettingsTabsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-muted" />
        <div className="space-y-2">
          <div className="h-6 w-32 rounded bg-muted" />
          <div className="h-4 w-24 rounded bg-muted" />
        </div>
      </div>
      <div className="h-12 w-full max-w-md rounded-xl bg-muted" />
      <div className="space-y-4">
        <div className="h-48 rounded-xl bg-muted" />
        <div className="h-32 rounded-xl bg-muted" />
      </div>
    </div>
  )
}

