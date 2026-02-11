/**
 * AI Summary Card Component
 *
 * Displays an AI-generated patient summary with distinctive visual styling.
 * Features a gradient AI indicator, "Generado por IA" badge, regenerate button,
 * and smooth animations. Designed to stand out as an intelligent feature.
 *
 * Created: 2026-02-10 - MV2-034 AI Summary Display
 */

'use client'

import { motion } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Sparkles, RefreshCw, Clock, Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface AiSummaryCardProps {
  summary: string
  generatedAt?: string
  isRegenerating?: boolean
  onRegenerate?: () => void
  className?: string
}

const textVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  },
}

const badgeVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 20,
      delay: 0.2,
    },
  },
}

export function AiSummaryCard({
  summary,
  generatedAt,
  isRegenerating = false,
  onRegenerate,
  className,
}: AiSummaryCardProps) {
  const formattedDate = generatedAt
    ? format(parseISO(generatedAt), "d 'de' MMMM, HH:mm", { locale: es })
    : null

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className={cn('relative', className)}
    >
      {/* AI Badge */}
      <motion.div
        variants={badgeVariants}
        className="absolute -top-2.5 left-4 z-10"
      >
        <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary via-primary to-primary/90 px-3 py-1 shadow-lg shadow-primary/25">
          <Sparkles className="h-3 w-3 text-primary-foreground" />
          <span className="text-xs font-semibold text-primary-foreground">
            Generado por IA
          </span>
        </div>
      </motion.div>

      {/* Summary Content */}
      <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 p-4 pt-5 dark:from-primary/10 dark:to-primary/5">
        <motion.p
          variants={textVariants}
          className="text-sm leading-relaxed text-foreground/90 md:text-base"
        >
          {summary}
        </motion.p>

        {/* Footer with timestamp and regenerate */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-primary/10 pt-3"
        >
          {formattedDate && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Actualizado {formattedDate}</span>
            </div>
          )}

          {onRegenerate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Regenerando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3" />
                  Regenerar
                </>
              )}
            </Button>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}

export function AiSummaryCardSkeleton() {
  return (
    <div className="relative">
      {/* Badge skeleton */}
      <div className="absolute -top-2.5 left-4 z-10">
        <div className="h-6 w-28 animate-pulse rounded-full bg-muted" />
      </div>

      {/* Content skeleton */}
      <div className="rounded-xl border border-border/50 bg-muted/30 p-4 pt-5">
        <div className="space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-11/12 animate-pulse rounded bg-muted" />
          <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
          <div className="h-3 w-32 animate-pulse rounded bg-muted" />
          <div className="h-6 w-20 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  )
}
