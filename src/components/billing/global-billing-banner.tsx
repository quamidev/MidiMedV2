/**
 * Global Billing Banner Component
 *
 * Persistent banner displayed for TRIAL_EXPIRED and PAST_DUE billing statuses.
 * Shows contextual messaging with upgrade CTA. Dismissible per session but
 * reappears on navigation.
 *
 * Created: 2026-02-10 - MV2-048 Global Billing Banner
 */

'use client'

import { useState, useCallback, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  Clock,
  X,
  ArrowRight,
  CreditCard,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { useUser } from '@/hooks/use-user'
import { Button } from '@/components/ui/button'
import type { BillingStatus } from '@/types/app'

// Custom hook for hydration-safe client detection
function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}

// =============================================================================
// Types
// =============================================================================

interface BannerConfig {
  icon: React.ElementType
  title: string
  message: string
  ctaText: string
  ctaHref: string
  variant: 'warning' | 'error'
}

// =============================================================================
// Configuration
// =============================================================================

const BANNER_CONFIGS: Partial<Record<BillingStatus, BannerConfig>> = {
  TRIAL_EXPIRED: {
    icon: Clock,
    title: 'Tu periodo de prueba ha terminado',
    message: 'Suscribete a un plan para continuar usando MidiMed sin interrupciones.',
    ctaText: 'Ver planes',
    ctaHref: '/pricing',
    variant: 'warning',
  },
  PAST_DUE: {
    icon: AlertTriangle,
    title: 'Pago pendiente',
    message: 'Tu ultima factura no pudo ser procesada. Actualiza tu metodo de pago para evitar interrupciones.',
    ctaText: 'Actualizar pago',
    ctaHref: '/settings?tab=billing',
    variant: 'error',
  },
}

// Session storage key for dismissed state
const DISMISSED_KEY = 'billing_banner_dismissed'

// =============================================================================
// Component
// =============================================================================

export function GlobalBillingBanner() {
  const { tenant, loading } = useUser()
  const pathname = usePathname()
  const isClient = useIsClient()

  // Track dismissed state - recalculate on each render based on pathname
  const [dismissedPath, setDismissedPath] = useState<string | null>(null)
  const isDismissed = dismissedPath === pathname

  // Handle dismiss
  const handleDismiss = useCallback(() => {
    setDismissedPath(pathname)
    if (isClient) {
      sessionStorage.setItem(DISMISSED_KEY, pathname)
    }
  }, [pathname, isClient])

  // Don't render if loading, not client, or no tenant
  if (!isClient || loading || !tenant) {
    return null
  }

  // Check if banner should show
  const config = BANNER_CONFIGS[tenant.billing_status]
  if (!config || isDismissed) {
    return null
  }

  const Icon = config.icon

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className={cn(
          'relative z-50 border-b',
          config.variant === 'error'
            ? 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900'
            : 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900'
        )}
      >
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Content */}
            <div className="flex items-start gap-3 sm:items-center">
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                  config.variant === 'error'
                    ? 'bg-red-100 dark:bg-red-900/50'
                    : 'bg-amber-100 dark:bg-amber-900/50'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5',
                    config.variant === 'error'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-amber-600 dark:text-amber-400'
                  )}
                />
              </div>

              <div>
                <p
                  className={cn(
                    'font-medium',
                    config.variant === 'error'
                      ? 'text-red-800 dark:text-red-200'
                      : 'text-amber-800 dark:text-amber-200'
                  )}
                >
                  {config.title}
                </p>
                <p
                  className={cn(
                    'text-sm',
                    config.variant === 'error'
                      ? 'text-red-700 dark:text-red-300'
                      : 'text-amber-700 dark:text-amber-300'
                  )}
                >
                  {config.message}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:shrink-0">
              <Button
                asChild
                size="sm"
                className={cn(
                  'group',
                  config.variant === 'error'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                )}
              >
                <Link href={config.ctaHref}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  {config.ctaText}
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>

              <button
                type="button"
                onClick={handleDismiss}
                className={cn(
                  'rounded-full p-1.5 transition-colors',
                  config.variant === 'error'
                    ? 'text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50'
                    : 'text-amber-600 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/50'
                )}
                aria-label="Cerrar banner"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
