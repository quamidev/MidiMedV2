/**
 * Checkout Modal Component
 *
 * Confirmation modal for plan upgrades with pricing details,
 * feature summary, and checkout initiation.
 *
 * Created: 2026-02-10 - MV2-047 Settings Billing Tab
 */

'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Crown,
  Zap,
  Building2,
  Check,
  ArrowRight,
  Shield,
  CreditCard,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createCheckoutSession } from '@/actions/billing'
import type { BillingPlan } from '@/types/app'

// =============================================================================
// Types
// =============================================================================

interface CheckoutModalProps {
  open: boolean
  onClose: () => void
  plan: BillingPlan
  planName: string
  price: number
  currency: 'GTQ' | 'USD'
  features: string[]
}

// =============================================================================
// Configuration
// =============================================================================

const PLAN_ICONS: Record<BillingPlan, React.ElementType> = {
  TRIAL: Zap,
  BASIC: Zap,
  PRO: Crown,
  ENTERPRISE: Building2,
}

// =============================================================================
// Component
// =============================================================================

export function CheckoutModal({
  open,
  onClose,
  plan,
  planName,
  price,
  currency,
  features,
}: CheckoutModalProps) {
  const [loading, setLoading] = useState(false)
  const Icon = PLAN_ICONS[plan]

  // Format price
  const formattedPrice = `${currency === 'GTQ' ? 'Q' : '$'}${price.toLocaleString()}`

  // Handle checkout
  const handleCheckout = useCallback(async () => {
    setLoading(true)
    try {
      const result = await createCheckoutSession({
        planId: plan,
        currency,
      })

      if (result.success) {
        // Redirect to checkout
        window.location.href = result.data.checkoutUrl
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      console.error('Checkout error:', error)
      toast.error('Error al iniciar el pago')
    } finally {
      setLoading(false)
    }
  }, [plan, currency])

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl',
                plan === 'PRO'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-primary/10 text-primary'
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            Confirmar suscripcion
          </DialogTitle>
          <DialogDescription>
            Estas a punto de suscribirte al plan {planName}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {/* Price Summary */}
          <div className="rounded-xl bg-muted/50 p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Plan {planName}</span>
              <div className="text-right">
                <span className="text-2xl font-bold text-foreground">{formattedPrice}</span>
                <span className="text-sm text-muted-foreground">/mes</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Facturacion mensual. Puedes cancelar en cualquier momento.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Incluye:</p>
            <ul className="space-y-2">
              {features.slice(0, 4).map((feature, index) => (
                <motion.li
                  key={feature}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  {feature}
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Security Note */}
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400">
            <Shield className="h-4 w-4" />
            Pago seguro procesado por Recurrente
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCheckout}
              isLoading={loading}
              className="group"
            >
              {!loading && (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Continuar al pago
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
              {loading && 'Preparando pago...'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
