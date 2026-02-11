/**
 * Billing Settings Component
 *
 * Main billing tab content showing current plan, upgrade options,
 * and invoice history. Admin-only access.
 *
 * Created: 2026-02-10 - MV2-047 Settings Billing Tab
 * Updated: 2026-02-10 - QA-011 Fixed price formatting (cents to display amount)
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Crown,
  Zap,
  Building2,
  ArrowUpRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { useUser } from '@/hooks/use-user'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CurrentPlanCard } from '@/components/billing/current-plan-card'
import { InvoiceTable } from '@/components/billing/invoice-table'
import { CheckoutModal } from '@/components/billing/checkout-modal'
import { CurrencyToggle } from '@/components/billing/currency-toggle'
import { getPlanCatalog } from '@/actions/billing'
import type { PlanCatalogEntry, BillingPlan } from '@/types/app'

// =============================================================================
// Types
// =============================================================================

interface UpgradePlan {
  id: BillingPlan
  name: string
  icon: React.ElementType
  features: string[]
  price: number | null
  highlighted?: boolean
}

// =============================================================================
// Configuration
// =============================================================================

const UPGRADE_PLANS: Omit<UpgradePlan, 'price'>[] = [
  {
    id: 'BASIC',
    name: 'Básico',
    icon: Zap,
    features: [
      'Hasta 200 pacientes',
      'Calendario ilimitado',
      'Soporte por correo',
    ],
  },
  {
    id: 'PRO',
    name: 'Profesional',
    icon: Crown,
    features: [
      'Pacientes ilimitados',
      'IA para expedientes',
      'Generacion de PDFs',
      'Hasta 5 usuarios',
    ],
    highlighted: true,
  },
  {
    id: 'ENTERPRISE',
    name: 'Empresarial',
    icon: Building2,
    features: [
      'Usuarios ilimitados',
      'Integraciones API',
      'SLA garantizado',
    ],
  },
]

// =============================================================================
// Component
// =============================================================================

export function BillingSettings() {
  const { tenant, loading: userLoading } = useUser()
  const [currency, setCurrency] = useState<'GTQ' | 'USD'>('GTQ')
  const [plans, setPlans] = useState<PlanCatalogEntry[]>([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<UpgradePlan | null>(null)

  // Fetch plan catalog
  const loadPlans = useCallback(async () => {
    setPlansLoading(true)
    try {
      const result = await getPlanCatalog()
      if (result.success) {
        setPlans(result.data)
      }
    } catch (error) {
      console.error('Error loading plans:', error)
    } finally {
      setPlansLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPlans()
  }, [loadPlans])

  // Get price for a plan
  const getPlanPrice = useCallback(
    (planId: BillingPlan): number | null => {
      const plan = plans.find(
        (p) => p.plan === planId && p.currency === currency
      )
      return plan?.price ?? null
    },
    [plans, currency]
  )

  // Build upgrade plans with prices
  const upgradePlans = useMemo(() => {
    return UPGRADE_PLANS.map((plan) => ({
      ...plan,
      price: getPlanPrice(plan.id),
    }))
  }, [getPlanPrice])

  // Filter available upgrades (plans higher than current)
  const availableUpgrades = useMemo(() => {
    if (!tenant) return upgradePlans

    const planOrder: BillingPlan[] = ['TRIAL', 'BASIC', 'PRO', 'ENTERPRISE']
    const currentIndex = planOrder.indexOf(tenant.billing_plan)

    return upgradePlans.filter((plan) => {
      const planIndex = planOrder.indexOf(plan.id)
      return planIndex > currentIndex
    })
  }, [tenant, upgradePlans])

  // Format price (price stored in centavos)
  const formatPrice = useCallback(
    (price: number | null): string => {
      if (price === null) return '—'
      const symbol = currency === 'GTQ' ? 'Q' : '$'
      const amount = price / 100
      return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    },
    [currency]
  )

  // Handle plan selection
  const handleSelectPlan = useCallback((plan: UpgradePlan) => {
    if (plan.id === 'ENTERPRISE') {
      window.location.href = 'mailto:ventas@midimed.io?subject=Plan%20Empresarial'
      return
    }
    setSelectedPlan(plan)
  }, [])

  // Loading state
  if (userLoading) {
    return <BillingSettingsSkeleton />
  }

  return (
    <div className="space-y-8">
      {/* Current Plan */}
      {tenant && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <CurrentPlanCard
            plan={tenant.billing_plan}
            status={tenant.billing_status}
            trialStartAt={tenant.trial_start_at}
            trialDays={tenant.trial_days}
            purchasedAt={tenant.purchased_at}
            paidThrough={tenant.paid_through}
          />
        </motion.section>
      )}

      {/* Upgrade Options */}
      {availableUpgrades.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Mejora tu plan
              </h3>
              <p className="text-sm text-muted-foreground">
                Desbloquea más funciones para tu clínica
              </p>
            </div>

            <CurrencyToggle
              currency={currency}
              onCurrencyChange={setCurrency}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {availableUpgrades.map((plan, index) => {
              const Icon = plan.icon

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                  className={cn(
                    'relative rounded-2xl border p-5 transition-all duration-300 hover:shadow-lg cursor-pointer',
                    plan.highlighted
                      ? 'border-primary/50 bg-primary/5 shadow-md'
                      : 'border-border bg-card hover:border-primary/30'
                  )}
                  onClick={() => handleSelectPlan(plan)}
                >
                  {/* Recommended badge */}
                  {plan.highlighted && (
                    <div className="absolute -top-2.5 right-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
                        <Sparkles className="h-3 w-3" />
                        Recomendado
                      </span>
                    </div>
                  )}

                  <div className="flex items-start justify-between">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-xl',
                        plan.highlighted
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-primary/10 text-primary'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-bold text-foreground">
                        {plansLoading ? '—' : formatPrice(plan.price)}
                      </div>
                      <div className="text-xs text-muted-foreground">/mes</div>
                    </div>
                  </div>

                  <h4 className="mt-4 font-semibold text-foreground">
                    {plan.name}
                  </h4>

                  <ul className="mt-3 space-y-1.5">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <div className="h-1 w-1 rounded-full bg-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={plan.highlighted ? 'default' : 'outline'}
                    size="sm"
                    className="mt-4 w-full group"
                  >
                    {plan.id === 'ENTERPRISE' ? 'Contactar' : 'Seleccionar'}
                    <ArrowUpRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Button>
                </motion.div>
              )
            })}
          </div>

          {/* Link to full pricing page */}
          <div className="text-center">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Ver todos los planes y caracteristicas
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </motion.section>
      )}

      {/* Invoice History */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <InvoiceTable limit={5} />
      </motion.section>

      {/* Checkout Modal */}
      {selectedPlan && selectedPlan.price !== null && (
        <CheckoutModal
          open={!!selectedPlan}
          onClose={() => setSelectedPlan(null)}
          plan={selectedPlan.id}
          planName={selectedPlan.name}
          price={selectedPlan.price}
          currency={currency}
          features={selectedPlan.features}
        />
      )}
    </div>
  )
}

// =============================================================================
// Skeleton
// =============================================================================

function BillingSettingsSkeleton() {
  return (
    <div className="space-y-8">
      {/* Current Plan Skeleton */}
      <div className="rounded-2xl border-2 border-border p-6">
        <div className="flex items-start gap-4">
          <Skeleton className="h-14 w-14 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60" />
          </div>
        </div>
      </div>

      {/* Upgrade Options Skeleton */}
      <div className="space-y-4">
        <div className="flex justify-between">
          <div className="space-y-1">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-36 rounded-full" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-border p-5">
              <div className="flex justify-between">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="mt-4 h-5 w-24" />
              <div className="mt-3 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="mt-4 h-9 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
