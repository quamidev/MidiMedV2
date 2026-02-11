/**
 * Notification Popover Component (Desktop)
 *
 * Desktop dropdown showing the 5 most recent unread notifications.
 * Features:
 * - Smooth entrance animation
 * - Click-to-navigate on each notification
 * - Mark all read action
 * - View all link to /notifications
 *
 * Created: 2026-02-10 - MV2-037 Notification Bell and Popover
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { CheckCheck, ArrowRight, Bell, Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { NotificationItem } from '@/components/notifications/notification-item'
import type { Notification } from '@/types/app'

interface NotificationPopoverProps {
  notifications: Notification[]
  unreadCount: number
  loading?: boolean
  onMarkAllRead: () => Promise<void>
  onNotificationClick: (notification: Notification) => void
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

/**
 * NotificationPopover component
 *
 * Desktop popover showing recent notifications with actions.
 */
export function NotificationPopover({
  notifications,
  unreadCount,
  loading = false,
  onMarkAllRead,
  onNotificationClick,
  children,
  open,
  onOpenChange,
}: NotificationPopoverProps) {
  // Show only 5 most recent unread notifications
  const recentUnread = notifications
    .filter((n) => !n.is_read)
    .slice(0, 5)

  // If no unread, show most recent notifications
  const displayNotifications = recentUnread.length > 0
    ? recentUnread
    : notifications.slice(0, 5)

  const hasMoreUnread = unreadCount > 5

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className={cn(
          'w-[380px] p-0 overflow-hidden',
          'shadow-xl shadow-black/10 dark:shadow-black/30',
          'border-border/50'
        )}
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">
              Notificaciones
            </h3>
            {unreadCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={onMarkAllRead}
            >
              <CheckCheck className="mr-1 h-3.5 w-3.5" />
              Marcar leidas
            </Button>
          )}
        </div>

        <Separator />

        {/* Notification List */}
        <div className="max-h-[360px] overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mb-2" />
              <p className="text-sm">Cargando...</p>
            </div>
          ) : displayNotifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-12 px-4"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                <Bell className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Sin notificaciones
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Te avisaremos cuando haya algo nuevo
              </p>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="py-1">
                {displayNotifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <NotificationItem
                      notification={notification}
                      onClick={() => onNotificationClick(notification)}
                      compact
                    />
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}

          {hasMoreUnread && (
            <div className="px-4 py-2 text-center">
              <p className="text-xs text-muted-foreground">
                +{unreadCount - 5} notificaciones sin leer
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <Separator />
        <div className="p-2">
          <Link href="/notifications" className="block">
            <Button
              variant="ghost"
              className="w-full justify-center text-sm font-medium text-primary hover:text-primary hover:bg-primary/10"
              onClick={() => onOpenChange?.(false)}
            >
              Ver todas
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
