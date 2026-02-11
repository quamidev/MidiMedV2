/**
 * Current Plan Card Component
 *
 * Displays the user's current billing plan with status, trial info,
 * and usage indicators. Features visual differentiation based on plan tier.
 *
 * Created: 2026-02-10 - MV2-047 Settings Billing Tab
 */

'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Sparkles,
  Zap,
  Crown,
  Building2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { differenceInDays, format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

import { cn } from '@/lib/utils'
import type { BillingPlan, BillingStatus } from '@/types/app'

// =============================================================================
// Types
// =============================================================================

interface CurrentPlanCardProps {
  plan: BillingPlan
  status: BillingStatus
  trialStartAt: string
  trialDays: number
  purchasedAt: string | null
  paidThrough: string | null
}

interface PlanConfig {
  name: string
  icon: React.ElementType
  color: string
  bgColor: string
  borderColor: string
}

// =============================================================================
// Configuration
// =============================================================================

const PLAN_CONFIGS: Record<BillingPlan, PlanConfig> = {
  TRIAL: {
    name: 'Prueba',
    icon: Sparkles,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
  BASIC: {
    name: 'Basico',
    icon: Zap,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  PRO: {
    name: 'Profesional',
    icon: Crown,
    color: 'text-primary',
    bgColor: 'bg-primary/5',
    borderColor: 'border-primary/30',
  },
  ENTERPRISE: {
    name: 'Empresarial',
    icon: Building2,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
}

const STATUS_LABELS: Record<BillingStatus, { label: string; variant: 'success' | 'warning' | 'error' }> = {
  TRIAL_ACTIVE: { label: 'Periodo de prueba', variant: 'success' },
  TRIAL_EXPIRED: { label: 'Prueba expirada', variant: 'error' },
  PAID_ACTIVE: { label: 'Activo', variant: 'success' },
  PAST_DUE: { label: 'Pago pendiente', variant: 'warning' },
}

// =============================================================================
// Component
// =============================================================================

export function CurrentPlanCard({
  plan,
  status,
  trialStartAt,
  trialDays,
  purchasedAt,
  paidThrough,
}: CurrentPlanCardProps) {
  const config = PLAN_CONFIGS[plan]
  const statusInfo = STATUS_LABELS[status]
  const Icon = config.icon

  // Calculate trial remaining days
  const trialInfo = useMemo(() => {
    if (status !== 'TRIAL_ACTIVE') return null

    const startDate = parseISO(trialStartAt)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + trialDays)

    const daysRemaining = differenceInDays(endDate, new Date())
    const percentUsed = Math.min(100, Math.max(0, ((trialDays - daysRemaining) / trialDays) * 100))

    return {
      daysRemaining: Math.max(0, daysRemaining),
      endDate: format(endDate, "d 'de' MMMM, yyyy", { locale: es }),
      percentUsed,
    }
  }, [status, trialStartAt, trialDays])

  // Format dates
  const formattedPurchasedAt = purchasedAt
    ? format(parseISO(purchasedAt), "d 'de' MMMM, yyyy", { locale: es })
    : null

  const formattedPaidThrough = paidThrough
    ? format(parseISO(paidThrough), "d 'de' MMMM, yyyy", { locale: es })
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'rounded-2xl border-2 p-6 transition-all duration-300',
        config.borderColor,
        config.bgColor
      )}
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        {/* Plan Info */}
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'flex h-14 w-14 items-center justify-center rounded-2xl',
              plan === 'PRO' ? 'bg-primary text-primary-foreground' : 'bg-background shadow-sm'
            )}
          >
            <Icon className={cn('h-7 w-7', plan !== 'PRO' && config.color)} />
          </div>

          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-semibold text-foreground">
                Plan {config.name}
              </h3>
              <StatusBadge variant={statusInfo.variant} label={statusInfo.label} />
            </div>

            {/* Subscription details */}
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              {formattedPurchasedAt && (
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Suscrito desde {formattedPurchasedAt}
                </p>
              )}
              {formattedPaidThrough && status === 'PAID_ACTIVE' && (
                <p className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Proximo cobro: {formattedPaidThrough}
                </p>
              )}
              {status === 'PAST_DUE' && formattedPaidThrough && (
                <p className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-4 w-4" />
                  Vencido desde {formattedPaidThrough}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Trial Progress */}
        {trialInfo && (
          <div className="rounded-xl bg-background/80 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Clock className="h-4 w-4 text-amber-500" />
              {trialInfo.daysRemaining} dias restantes
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Expira el {trialInfo.endDate}
            </p>

            {/* Progress bar */}
            <div className="mt-3 h-2 w-48 overflow-hidden rounded-full bg-muted">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${trialInfo.percentUsed}%` }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className={cn(
                  'h-full rounded-full transition-colors',
                  trialInfo.daysRemaining <= 5
                    ? 'bg-amber-500'
                    : 'bg-primary'
                )}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// =============================================================================
// Status Badge
// =============================================================================

interface StatusBadgeProps {
  variant: 'success' | 'warning' | 'error'
  label: string
}

function StatusBadge({ variant, label }: StatusBadgeProps) {
  const variantStyles = {
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
    error: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantStyles[variant]
      )}
    >
      {label}
    </span>
  )
}
