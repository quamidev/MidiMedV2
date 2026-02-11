/**
 * Currency Toggle Component
 *
 * Elegant toggle switch for selecting between GTQ and USD currencies.
 * Features smooth sliding animation and visual feedback.
 *
 * Created: 2026-02-10 - MV2-046 Pricing Page
 */

'use client'

import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'

interface CurrencyToggleProps {
  currency: 'GTQ' | 'USD'
  onCurrencyChange: (currency: 'GTQ' | 'USD') => void
  className?: string
}

export function CurrencyToggle({
  currency,
  onCurrencyChange,
  className,
}: CurrencyToggleProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-3 rounded-full bg-muted/50 p-1 border border-border/50',
        className
      )}
    >
      <button
        type="button"
        onClick={() => onCurrencyChange('GTQ')}
        className={cn(
          'relative px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200',
          currency === 'GTQ'
            ? 'text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        {currency === 'GTQ' && (
          <motion.div
            layoutId="currency-indicator"
            className="absolute inset-0 bg-primary rounded-full shadow-md"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-1.5">
          <span className="text-xs opacity-75">Q</span>
          GTQ
        </span>
      </button>

      <button
        type="button"
        onClick={() => onCurrencyChange('USD')}
        className={cn(
          'relative px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200',
          currency === 'USD'
            ? 'text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        {currency === 'USD' && (
          <motion.div
            layoutId="currency-indicator"
            className="absolute inset-0 bg-primary rounded-full shadow-md"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-1.5">
          <span className="text-xs opacity-75">$</span>
          USD
        </span>
      </button>
    </div>
  )
}
