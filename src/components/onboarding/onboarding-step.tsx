/**
 * Onboarding Step Component
 *
 * Displays an individual onboarding step with icon, label, and completion status.
 * Features smooth animations and optional navigation link.
 *
 * Created: 2026-02-10 - MV2-057 Onboarding Tutorial System
 */

'use client'

import Link from 'next/link'
import { Check, type LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'

interface OnboardingStepProps {
  /** Step label text */
  label: string
  /** Brief description of the step */
  description?: string
  /** Icon component to display */
  icon: LucideIcon
  /** Whether the step is completed */
  completed: boolean
  /** Optional link to navigate when clicking */
  href?: string
  /** Step index for staggered animation */
  index?: number
  /** Whether this is the current/next step to complete */
  isNext?: boolean
}

/**
 * Individual onboarding step with visual completion indicator.
 * Renders as a link if href is provided, otherwise as a div.
 */
export function OnboardingStep({
  label,
  description,
  icon: Icon,
  completed,
  href,
  index = 0,
  isNext = false,
}: OnboardingStepProps) {
  const content = (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={cn(
        'group relative flex items-center gap-3 rounded-xl p-3 transition-all duration-300',
        completed
          ? 'bg-primary/5'
          : isNext
            ? 'bg-accent hover:bg-accent/80'
            : 'hover:bg-accent/50',
        href && !completed && 'cursor-pointer'
      )}
    >
      {/* Icon container with completion state */}
      <div
        className={cn(
          'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-all duration-300',
          completed
            ? 'bg-primary text-primary-foreground'
            : isNext
              ? 'bg-primary/15 text-primary'
              : 'bg-muted text-muted-foreground'
        )}
      >
        {completed ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 15,
              delay: 0.1,
            }}
          >
            <Check className="h-5 w-5" />
          </motion.div>
        ) : (
          <Icon className="h-5 w-5" />
        )}

        {/* Pulsing ring for next step */}
        {isNext && !completed && (
          <>
            <span className="absolute inset-0 animate-ping rounded-lg bg-primary/20" />
            <span className="absolute -inset-1 animate-pulse rounded-xl border-2 border-primary/30" />
          </>
        )}
      </div>

      {/* Text content */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'text-sm font-medium transition-colors duration-200',
            completed ? 'text-foreground' : 'text-foreground'
          )}
        >
          {label}
        </p>
        {description && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {/* Completion indicator text */}
      {completed && (
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="shrink-0 text-xs font-medium text-primary"
        >
          Listo
        </motion.span>
      )}

      {/* Arrow indicator for actionable steps */}
      {!completed && href && (
        <motion.span
          className="shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
          aria-hidden="true"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </motion.span>
      )}
    </motion.div>
  )

  // Wrap in Link if href provided and not completed
  if (href && !completed) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    )
  }

  return content
}
