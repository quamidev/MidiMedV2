/**
 * Notifications Page
 *
 * Full-page notification center with filtering, bulk actions,
 * and archive management.
 *
 * Created: 2026-02-10 - QA Fix: Missing notifications page
 * Updated: 2026-02-10 - QA-009 Unified page layout with consistent padding/max-width
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  CheckCheck,
  Archive,
  Inbox,
  Loader2,
  BellOff,
} from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { NotificationItem } from '@/components/notifications/notification-item'
import {
  getNotifications,
  markAsRead,
  markAllRead,
  archiveNotification,
  archiveAll,
} from '@/actions/notifications'
import type { Notification } from '@/types/app'

type Tab = 'inbox' | 'archived'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('inbox')
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getNotifications({
        archived: activeTab === 'archived',
        limit: 50,
      })
      if (result.success && result.data) {
        setNotifications(result.data.notifications)
        setUnreadCount(result.data.unreadCount)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const handleMarkAsRead = useCallback(
    async (id: string) => {
      const result = await markAsRead(id)
      if (result.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    },
    []
  )

  const handleArchive = useCallback(
    async (id: string) => {
      const result = await archiveNotification(id)
      if (result.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
        toast.success('Notificacion archivada')
      }
    },
    []
  )

  const handleMarkAllRead = useCallback(async () => {
    setActionLoading(true)
    try {
      const result = await markAllRead()
      if (result.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
        setUnreadCount(0)
        toast.success('Todas marcadas como leidas')
      }
    } finally {
      setActionLoading(false)
    }
  }, [])

  const handleArchiveAll = useCallback(async () => {
    setActionLoading(true)
    try {
      const result = await archiveAll()
      if (result.success) {
        setNotifications([])
        toast.success('Todas archivadas')
      }
    } finally {
      setActionLoading(false)
    }
  }, [])

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Notificaciones
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} sin leer`
              : 'Todas las notificaciones leidas'}
          </p>
        </div>

        {/* Bulk actions */}
        <div className="flex gap-2">
          {activeTab === 'inbox' && notifications.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllRead}
                disabled={actionLoading || unreadCount === 0}
              >
                <CheckCheck className="mr-1.5 h-4 w-4" />
                Marcar leidas
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleArchiveAll}
                disabled={actionLoading}
              >
                <Archive className="mr-1.5 h-4 w-4" />
                Archivar todas
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border/50 bg-muted/50 p-1">
        <button
          onClick={() => setActiveTab('inbox')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all',
            activeTab === 'inbox'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Inbox className="h-4 w-4" />
          Bandeja
          {unreadCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('archived')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all',
            activeTab === 'archived'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Archive className="h-4 w-4" />
          Archivadas
        </button>
      </div>

      {/* Notification List */}
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/50 bg-card p-4"
            >
              <div className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </div>
          ))
        ) : notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <BellOff className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground">
              {activeTab === 'inbox'
                ? 'No tienes notificaciones'
                : 'No hay notificaciones archivadas'}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {activeTab === 'inbox'
                ? 'Las notificaciones de citas, pacientes y facturación aparecerán aquí.'
                : 'Las notificaciones que archives aparecerán en esta sección.'}
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {notifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.03 }}
              >
                <div className="group relative rounded-xl border border-border/50 bg-card transition-all hover:border-border hover:shadow-sm">
                  <NotificationItem
                    notification={notification}
                    onClick={() => {
                      if (!notification.is_read) {
                        handleMarkAsRead(notification.id)
                      }
                    }}
                  />
                  {/* Action buttons on hover */}
                  {activeTab === 'inbox' && (
                    <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMarkAsRead(notification.id)
                          }}
                        >
                          <CheckCheck className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleArchive(notification.id)
                        }}
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Loading spinner for actions */}
      {actionLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-lg">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm font-medium">Procesando...</span>
          </div>
        </div>
      )}
    </div>
  )
}
