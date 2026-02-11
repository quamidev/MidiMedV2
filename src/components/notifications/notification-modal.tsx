/**
 * Notification Modal Component (Mobile)
 *
 * Full-screen modal for mobile devices showing all unread notifications.
 * Features:
 * - Slide-up entrance animation
 * - Scrollable notification list
 * - Mark all read action
 * - View all link to /notifications
 *
 * Created: 2026-02-10 - MV2-037 Notification Bell and Popover
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { CheckCheck, ArrowRight, Bell, X, Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { NotificationItem } from '@/components/notifications/notification-item'
import type { Notification } from '@/types/app'

interface NotificationModalProps {
  notifications: Notification[]
  unreadCount: number
  loading?: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onMarkAllRead: () => Promise<void>
  onNotificationClick: (notification: Notification) => void
}

/**
 * NotificationModal component
 *
 * Mobile full-screen modal for viewing notifications.
 */
export function NotificationModal({
  notifications,
  unreadCount,
  loading = false,
  open,
  onOpenChange,
  onMarkAllRead,
  onNotificationClick,
}: NotificationModalProps) {
  // Filter to show unread first, then read
  const sortedNotifications = [...notifications].sort((a, b) => {
    if (a.is_read !== b.is_read) {
      return a.is_read ? 1 : -1
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const handleNotificationClick = (notification: Notification) => {
    onNotificationClick(notification)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'fixed inset-x-0 bottom-0 top-auto max-w-full translate-x-0 translate-y-0',
          'h-[85vh] rounded-t-2xl border-t border-x border-b-0 p-0',
          'data-[state=open]:slide-in-from-bottom-full',
          'data-[state=closed]:slide-out-to-bottom-full',
          'sm:left-[50%] sm:top-[50%] sm:bottom-auto sm:h-auto sm:max-h-[85vh]',
          'sm:max-w-lg sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-xl sm:border'
        )}
      >
        {/* Header */}
        <DialogHeader className="flex-row items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <Bell className="h-4 w-4 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Notificaciones
              </DialogTitle>
              {unreadCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  {unreadCount} sin leer
                </p>
              )}
            </div>
          </div>
          <DialogClose className="rounded-full p-2 opacity-70 hover:opacity-100 hover:bg-accent transition-colors">
            <X className="h-5 w-5" />
            <span className="sr-only">Cerrar</span>
          </DialogClose>
        </DialogHeader>

        {/* Actions Bar */}
        {unreadCount > 0 && (
          <>
            <div className="flex items-center justify-between px-4 py-2 bg-muted/30">
              <span className="text-sm text-muted-foreground">
                {unreadCount} {unreadCount === 1 ? 'nueva' : 'nuevas'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-sm text-primary hover:text-primary hover:bg-primary/10"
                onClick={onMarkAllRead}
              >
                <CheckCheck className="mr-1.5 h-4 w-4" />
                Marcar todas leidas
              </Button>
            </div>
            <Separator />
          </>
        )}

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-3" />
              <p className="text-sm">Cargando notificaciones...</p>
            </div>
          ) : sortedNotifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-16 px-6"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-base font-medium text-foreground">
                No tienes notificaciones
              </p>
              <p className="text-sm text-muted-foreground mt-1 text-center">
                Aquí aparecerán las actualizaciones de tu clínica
              </p>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="py-1">
                {sortedNotifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: Math.min(index * 0.03, 0.3) }}
                  >
                    <NotificationItem
                      notification={notification}
                      onClick={() => handleNotificationClick(notification)}
                    />
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        <Separator />
        <div className="p-3 pb-safe">
          <Link href="/notifications" onClick={() => onOpenChange(false)}>
            <Button
              variant="outline"
              className="w-full justify-center text-sm font-medium"
            >
              Ver todas las notificaciones
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  )
}
