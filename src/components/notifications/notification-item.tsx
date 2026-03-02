/**
 * Notification Item Component
 *
 * Individual notification display with unread indicator, title, body preview,
 * and relative timestamp. Supports click-to-navigate and hover states.
 *
 * Created: 2026-02-10 - MV2-037 Notification Bell and Popover
 * Updated: 2026-03-02 - AO-007 Added no_show and rescheduled notification type mappings
 */

'use client'

import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Calendar,
  User,
  FileText,
  Users,
  CreditCard,
  Bell,
  UserX,
  RefreshCw,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import type { Notification, NotificationType } from '@/types/app'

interface NotificationItemProps {
  notification: Notification
  onClick?: () => void
  compact?: boolean
}

/**
 * Maps notification type to an icon component
 */
function getNotificationIcon(type: NotificationType) {
  const iconMap: Record<NotificationType, typeof Bell> = {
    general: Bell,
    appointment_created: Calendar,
    appointment_cancelled: Calendar,
    appointment_reminder: Calendar,
    appointment_no_show: UserX,
    appointment_rescheduled: RefreshCw,
    patient_created: User,
    medical_record_created: FileText,
    team_invite: Users,
    billing_alert: CreditCard,
  }
  return iconMap[type] || Bell
}

/**
 * Maps notification type to a color class for the icon
 */
function getIconColorClass(type: NotificationType): string {
  const colorMap: Record<NotificationType, string> = {
    general: 'text-muted-foreground',
    appointment_created: 'text-primary',
    appointment_cancelled: 'text-destructive',
    appointment_reminder: 'text-amber-500 dark:text-amber-400',
    appointment_no_show: 'text-amber-600 dark:text-amber-400',
    appointment_rescheduled: 'text-slate-500 dark:text-slate-400',
    patient_created: 'text-emerald-500 dark:text-emerald-400',
    medical_record_created: 'text-blue-500 dark:text-blue-400',
    team_invite: 'text-violet-500 dark:text-violet-400',
    billing_alert: 'text-orange-500 dark:text-orange-400',
  }
  return colorMap[type] || 'text-muted-foreground'
}

/**
 * NotificationItem component
 *
 * Displays a single notification with type-specific icon, title, body preview,
 * and relative timestamp. Unread notifications show a teal dot indicator.
 */
export function NotificationItem({
  notification,
  onClick,
  compact = false,
}: NotificationItemProps) {
  const Icon = getNotificationIcon(notification.type)
  const iconColorClass = getIconColorClass(notification.type)

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: es,
  })

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'group relative flex w-full items-start gap-3 rounded-lg text-left transition-colors',
        'hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        compact ? 'px-3 py-2.5' : 'px-4 py-3',
        !notification.is_read && 'bg-primary/[0.03] dark:bg-primary/[0.06]'
      )}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Unread indicator */}
      {!notification.is_read && (
        <span
          className={cn(
            'absolute left-1 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary',
            'shadow-[0_0_6px_2px] shadow-primary/30'
          )}
          aria-label="No leida"
        />
      )}

      {/* Icon */}
      <div
        className={cn(
          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          'bg-muted/50 transition-colors group-hover:bg-muted',
          compact && 'h-7 w-7'
        )}
      >
        <Icon className={cn('h-4 w-4', iconColorClass, compact && 'h-3.5 w-3.5')} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'truncate font-medium leading-tight text-foreground',
            compact ? 'text-sm' : 'text-sm',
            !notification.is_read && 'font-semibold'
          )}
        >
          {notification.title}
        </p>
        <p
          className={cn(
            'mt-0.5 line-clamp-2 text-muted-foreground',
            compact ? 'text-xs' : 'text-sm'
          )}
        >
          {notification.body}
        </p>
        <p
          className={cn(
            'mt-1 text-muted-foreground/70',
            compact ? 'text-[10px]' : 'text-xs'
          )}
        >
          {timeAgo}
        </p>
      </div>
    </motion.button>
  )
}
