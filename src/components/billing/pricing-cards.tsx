/**
 * Pricing Cards Component
 *
 * Displays pricing plans with feature comparison, currency support,
 * and appropriate CTAs based on authentication state.
 * Features staggered reveal animations and elevated design for recommended plan.
 *
 * Created: 2026-02-10 - MV2-046 Pricing Page
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Check,
  Sparkles,
  Zap,
  Crown,
  Building2,
  ArrowRight,
  Users,
  Calendar,
  FileText,
  Brain,
  Download,
  Shield,
  Headphones,
  Infinity,
  Star,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { getPlanCatalog, createCheckoutSession } from '@/actions/billing'
import type { PlanCatalogEntry } from '@/actions/billing'
import type { BillingPlan } from '@/types/app'

// =============================================================================
// Types
// =============================================================================

interface PricingCardsProps {
  currency: 'GTQ' | 'USD'
  isAuthenticated: boolean
  currentPlan?: BillingPlan
}

interface PlanDisplayConfig {
  id: BillingPlan
  name: string
  description: string
  icon: React.ElementType
  features: string[]
  highlighted?: boolean
  badge?: string
  ctaText: string
  ctaVariant: 'default' | 'outline' | 'secondary'
}

// =============================================================================
// Plan Configuration
// =============================================================================

const PLAN_CONFIGS: PlanDisplayConfig[] = [
  {
    id: 'TRIAL',
    name: 'Prueba',
    description: '30 dias gratis para explorar todas las funciones',
    icon: Sparkles,
    features: [
      'Hasta 50 pacientes',
      'Calendario de citas',
      'Expedientes medicos',
      'Acceso completo por 30 dias',
    ],
    ctaText: 'Empieza gratis',
    ctaVariant: 'outline',
  },
  {
    id: 'BASIC',
    name: 'Basico',
    description: 'Ideal para consultorios pequenos',
    icon: Zap,
    features: [
      'Hasta 200 pacientes',
      'Calendario ilimitado',
      'Expedientes medicos',
      'Soporte por correo',
      '1 usuario incluido',
    ],
    ctaText: 'Seleccionar plan',
    ctaVariant: 'outline',
  },
  {
    id: 'PRO',
    name: 'Profesional',
    description: 'Para clinicas en crecimiento',
    icon: Crown,
    features: [
      'Pacientes ilimitados',
      'Calendario ilimitado',
      'Expedientes con IA',
      'Generacion de PDFs',
      'Resumen de pacientes con IA',
      'Hasta 5 usuarios',
      'Soporte prioritario',
    ],
    highlighted: true,
    badge: 'Mas popular',
    ctaText: 'Seleccionar plan',
    ctaVariant: 'default',
  },
  {
    id: 'ENTERPRISE',
    name: 'Empresarial',
    description: 'Soluciones personalizadas para grandes organizaciones',
    icon: Building2,
    features: [
      'Todo en Profesional',
      'Usuarios ilimitados',
      'Integraciones personalizadas',
      'SLA garantizado',
      'Onboarding dedicado',
      'Gerente de cuenta',
    ],
    ctaText: 'Contactanos',
    ctaVariant: 'secondary',
  },
]

const FEATURE_ICONS: Record<string, React.ElementType> = {
  'pacientes': Users,
  'calendario': Calendar,
  'expedientes': FileText,
  'ia': Brain,
  'pdf': Download,
  'usuarios': Users,
  'soporte': Headphones,
  'ilimitado': Infinity,
  'integraciones': Shield,
}

function getFeatureIcon(feature: string): React.ElementType {
  const lowerFeature = feature.toLowerCase()
  for (const [key, icon] of Object.entries(FEATURE_ICONS)) {
    if (lowerFeature.includes(key)) return icon
  }
  return Check
}

// =============================================================================
// Component
// =============================================================================

export function PricingCards({
  currency,
  isAuthenticated,
  currentPlan,
}: PricingCardsProps) {
  const router = useRouter()
  const [plans, setPlans] = useState<PlanCatalogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)

  // Fetch plan catalog
  const loadPlans = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getPlanCatalog()
      if (result.success) {
        setPlans(result.data)
      } else {
        toast.error('Error al cargar planes')
      }
    } catch (error) {
      console.error('Error loading plans:', error)
      toast.error('Error al cargar planes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPlans()
  }, [loadPlans])

  // Get price for a plan in current currency
  const getPlanPrice = useCallback(
    (planId: BillingPlan): number | null => {
      const plan = plans.find(
        (p) => p.plan === planId && p.currency === currency
      )
      return plan?.price ?? null
    },
    [plans, currency]
  )

  // Format price for display
  const formatPrice = useCallback(
    (price: number | null): string => {
      if (price === null) return '—'
      const symbol = currency === 'GTQ' ? 'Q' : '$'
      return `${symbol}${price.toLocaleString()}`
    },
    [currency]
  )

  // Handle plan selection
  const handleSelectPlan = useCallback(
    async (planId: BillingPlan) => {
      if (planId === 'ENTERPRISE') {
        // Open contact form or email
        window.location.href = 'mailto:ventas@midimed.io?subject=Plan%20Empresarial'
        return
      }

      if (planId === 'TRIAL') {
        // Redirect to signup
        router.push('/signup')
        return
      }

      if (!isAuthenticated) {
        // Redirect to signup with intent
        router.push(`/signup?plan=${planId}`)
        return
      }

      // Start checkout
      setCheckoutLoading(planId)
      try {
        const result = await createCheckoutSession({
          planId,
          currency,
        })

        if (result.success) {
          window.location.href = result.data.checkoutUrl
        } else {
          toast.error(result.error)
        }
      } catch (error) {
        console.error('Checkout error:', error)
        toast.error('Error al iniciar el pago')
      } finally {
        setCheckoutLoading(null)
      }
    },
    [isAuthenticated, currency, router]
  )

  // Check if plan is current user's plan
  const isCurrentPlan = useCallback(
    (planId: BillingPlan): boolean => {
      return currentPlan === planId
    },
    [currentPlan]
  )

  // Memoized plan cards
  const planCards = useMemo(() => {
    return PLAN_CONFIGS.map((config, index) => {
      const price = getPlanPrice(config.id)
      const isCurrent = isCurrentPlan(config.id)
      const isLoading = checkoutLoading === config.id

      return (
        <motion.div
          key={config.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
          className={cn(
            'relative flex flex-col rounded-2xl border bg-card p-6 transition-all duration-300',
            config.highlighted
              ? 'border-primary/50 shadow-xl shadow-primary/10 scale-[1.02] z-10'
              : 'border-border hover:border-primary/30 hover:shadow-lg'
          )}
        >
          {/* Popular badge */}
          {config.badge && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.3 }}
                className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground shadow-md"
              >
                <Star className="h-3 w-3" />
                {config.badge}
              </motion.div>
            </div>
          )}

          {/* Header */}
          <div className="mb-6">
            <div
              className={cn(
                'mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl',
                config.highlighted
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-primary/10 text-primary'
              )}
            >
              <config.icon className="h-6 w-6" />
            </div>

            <h3 className="text-xl font-semibold text-foreground">
              {config.name}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {config.description}
            </p>
          </div>

          {/* Price */}
          <div className="mb-6">
            {config.id === 'TRIAL' ? (
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-foreground">Gratis</span>
              </div>
            ) : config.id === 'ENTERPRISE' ? (
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-foreground">Personalizado</span>
              </div>
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-foreground">
                  {loading ? '—' : formatPrice(price)}
                </span>
                <span className="text-muted-foreground">/mes</span>
              </div>
            )}
          </div>

          {/* Features */}
          <ul className="mb-8 flex-1 space-y-3">
            {config.features.map((feature, i) => {
              const FeatureIcon = getFeatureIcon(feature)
              return (
                <motion.li
                  key={feature}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 + i * 0.05 }}
                  className="flex items-start gap-3 text-sm text-foreground"
                >
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <FeatureIcon className="h-3 w-3 text-primary" />
                  </div>
                  {feature}
                </motion.li>
              )
            })}
          </ul>

          {/* CTA Button */}
          <Button
            variant={config.ctaVariant}
            size="lg"
            className={cn(
              'w-full group',
              config.highlighted && 'shadow-md'
            )}
            onClick={() => handleSelectPlan(config.id)}
            disabled={isCurrent || isLoading}
            isLoading={isLoading}
          >
            {isCurrent ? (
              'Plan actual'
            ) : (
              <>
                {config.ctaText}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </Button>
        </motion.div>
      )
    })
  }, [
    getPlanPrice,
    formatPrice,
    isCurrentPlan,
    checkoutLoading,
    handleSelectPlan,
    loading,
  ])

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {planCards}
    </div>
  )
}

// =============================================================================
// Feature Comparison Table
// =============================================================================

interface FeatureRow {
  feature: string
  trial: boolean | string
  basic: boolean | string
  pro: boolean | string
  enterprise: boolean | string
}

const FEATURE_COMPARISON: FeatureRow[] = [
  { feature: 'Limite de pacientes', trial: '50', basic: '200', pro: 'Ilimitado', enterprise: 'Ilimitado' },
  { feature: 'Calendario de citas', trial: true, basic: true, pro: true, enterprise: true },
  { feature: 'Expedientes medicos', trial: true, basic: true, pro: true, enterprise: true },
  { feature: 'Generacion de PDFs', trial: false, basic: false, pro: true, enterprise: true },
  { feature: 'Resumen con IA', trial: false, basic: false, pro: true, enterprise: true },
  { feature: 'Usuarios incluidos', trial: '1', basic: '1', pro: '5', enterprise: 'Ilimitado' },
  { feature: 'Soporte', trial: 'Comunidad', basic: 'Email', pro: 'Prioritario', enterprise: 'Dedicado' },
  { feature: 'Integraciones API', trial: false, basic: false, pro: false, enterprise: true },
  { feature: 'SLA garantizado', trial: false, basic: false, pro: false, enterprise: true },
]

export function FeatureComparison() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="mt-16 overflow-x-auto"
    >
      <h3 className="mb-8 text-center text-2xl font-semibold text-foreground">
        Comparacion de funciones
      </h3>

      <div className="min-w-[640px] rounded-2xl border border-border bg-card overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-5 border-b border-border bg-muted/30">
          <div className="px-6 py-4 font-medium text-foreground">Funcion</div>
          {['Prueba', 'Basico', 'Profesional', 'Empresarial'].map((plan) => (
            <div
              key={plan}
              className={cn(
                'px-4 py-4 text-center font-medium',
                plan === 'Profesional'
                  ? 'bg-primary/5 text-primary'
                  : 'text-foreground'
              )}
            >
              {plan}
            </div>
          ))}
        </div>

        {/* Rows */}
        {FEATURE_COMPARISON.map((row, index) => (
          <div
            key={row.feature}
            className={cn(
              'grid grid-cols-5 border-b border-border last:border-0',
              index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
            )}
          >
            <div className="px-6 py-4 text-sm text-foreground">{row.feature}</div>
            {[row.trial, row.basic, row.pro, row.enterprise].map((value, i) => (
              <div
                key={i}
                className={cn(
                  'flex items-center justify-center px-4 py-4 text-sm',
                  i === 2 && 'bg-primary/5'
                )}
              >
                {typeof value === 'boolean' ? (
                  value ? (
                    <Check className="h-5 w-5 text-primary" />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )
                ) : (
                  <span className="font-medium text-foreground">{value}</span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </motion.div>
  )
}
