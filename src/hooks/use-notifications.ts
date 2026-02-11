/**
 * Real-time Notifications Hook
 *
 * Provides live notification data with Supabase Realtime subscription.
 * Features:
 * - Initial fetch of notifications
 * - Real-time INSERT/UPDATE/DELETE handling
 * - Unread count calculation
 * - Optimistic updates for mark-as-read actions
 *
 * Created: 2026-02-10 - MV2-036 Real-time Notifications Hook
 */

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import {
  getNotifications,
  markAsRead as markAsReadAction,
  markAllRead as markAllReadAction,
  archiveNotification,
  unarchiveNotification,
  archiveAll as archiveAllAction,
} from '@/actions/notifications'
import type { Notification, NotificationMetadata } from '@/types/app'

interface UseNotificationsOptions {
  /** Maximum number of notifications to fetch initially */
  limit?: number
  /** Whether to subscribe to real-time updates */
  enableRealtime?: boolean
}

interface UseNotificationsReturn {
  /** List of notifications (non-archived by default) */
  notifications: Notification[]
  /** Number of unread, non-archived notifications */
  unreadCount: number
  /** Whether notifications are being loaded */
  loading: boolean
  /** Mark a single notification as read (optimistic) */
  markAsRead: (notificationId: string) => Promise<void>
  /** Mark all notifications as read (optimistic) */
  markAllRead: () => Promise<void>
  /** Archive a single notification */
  archive: (notificationId: string) => Promise<void>
  /** Unarchive a single notification */
  unarchive: (notificationId: string) => Promise<void>
  /** Archive all notifications */
  archiveAll: () => Promise<void>
  /** Refresh notifications from server */
  refresh: () => Promise<void>
  /** Navigate to entity based on notification metadata */
  navigateToEntity: (notification: Notification) => void
}

/**
 * Hook for managing notifications with real-time updates
 *
 * @param options Configuration options
 * @returns Notifications state and actions
 *
 * @example
 * ```tsx
 * function NotificationBell() {
 *   const { notifications, unreadCount, markAsRead } = useNotifications()
 *
 *   return (
 *     <div>
 *       <Bell />
 *       {unreadCount > 0 && <Badge>{unreadCount}</Badge>}
 *     </div>
 *   )
 * }
 * ```
 */
export function useNotifications(
  options: UseNotificationsOptions = {}
): UseNotificationsReturn {
  const { limit = 50, enableRealtime = true } = options

  const { user } = useUser()
  const router = useRouter()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = useMemo(() => createClient(), [])

  /**
   * Fetches notifications from the server
   */
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      // Fetch non-archived notifications
      const result = await getNotifications({ archived: false, limit })

      if (result.success) {
        setNotifications(result.data.notifications)
      } else {
        console.error('Failed to fetch notifications:', result.error)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id, limit])

  /**
   * Mark a single notification as read with optimistic update
   */
  const markAsRead = useCallback(
    async (notificationId: string) => {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      )

      try {
        const result = await markAsReadAction(notificationId)
        if (!result.success) {
          // Revert optimistic update on failure
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === notificationId ? { ...n, is_read: false } : n
            )
          )
          console.error('Failed to mark notification as read:', result.error)
        }
      } catch (error) {
        // Revert optimistic update on error
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, is_read: false } : n
          )
        )
        console.error('Error marking notification as read:', error)
      }
    },
    []
  )

  /**
   * Mark all notifications as read with optimistic update
   */
  const markAllRead = useCallback(async () => {
    // Store current state for potential rollback
    const previousNotifications = [...notifications]

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))

    try {
      const result = await markAllReadAction()
      if (!result.success) {
        // Revert optimistic update on failure
        setNotifications(previousNotifications)
        console.error('Failed to mark all notifications as read:', result.error)
      }
    } catch (error) {
      // Revert optimistic update on error
      setNotifications(previousNotifications)
      console.error('Error marking all notifications as read:', error)
    }
  }, [notifications])

  /**
   * Archive a single notification
   */
  const archive = useCallback(
    async (notificationId: string) => {
      // Optimistic update - remove from list
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))

      try {
        const result = await archiveNotification(notificationId)
        if (!result.success) {
          // Refresh to restore state on failure
          await fetchNotifications()
          console.error('Failed to archive notification:', result.error)
        }
      } catch (error) {
        // Refresh to restore state on error
        await fetchNotifications()
        console.error('Error archiving notification:', error)
      }
    },
    [fetchNotifications]
  )

  /**
   * Unarchive a single notification
   */
  const unarchive = useCallback(
    async (notificationId: string) => {
      try {
        const result = await unarchiveNotification(notificationId)
        if (result.success) {
          // Refresh to include unarchived notification
          await fetchNotifications()
        } else {
          console.error('Failed to unarchive notification:', result.error)
        }
      } catch (error) {
        console.error('Error unarchiving notification:', error)
      }
    },
    [fetchNotifications]
  )

  /**
   * Archive all notifications
   */
  const archiveAll = useCallback(async () => {
    // Store current state for potential rollback
    const previousNotifications = [...notifications]

    // Optimistic update - clear all
    setNotifications([])

    try {
      const result = await archiveAllAction()
      if (!result.success) {
        // Revert optimistic update on failure
        setNotifications(previousNotifications)
        console.error('Failed to archive all notifications:', result.error)
      }
    } catch (error) {
      // Revert optimistic update on error
      setNotifications(previousNotifications)
      console.error('Error archiving all notifications:', error)
    }
  }, [notifications])

  /**
   * Navigate to the entity referenced in notification metadata
   */
  const navigateToEntity = useCallback(
    (notification: Notification) => {
      const metadata = notification.metadata as NotificationMetadata

      // Mark as read when navigating
      if (!notification.is_read) {
        markAsRead(notification.id)
      }

      // Navigate based on notification type and metadata
      if (metadata.patient_id) {
        router.push(`/patients/${metadata.patient_id}`)
      } else if (metadata.appointment_id) {
        // Appointments are viewed in the dashboard calendar
        router.push('/dashboard')
      } else if (metadata.medical_record_id && metadata.patient_id) {
        router.push(`/patients/${metadata.patient_id}`)
      } else if (notification.type === 'team_invite') {
        router.push('/settings')
      } else if (notification.type === 'billing_alert') {
        router.push('/settings')
      } else {
        // Default: go to notifications page
        router.push('/notifications')
      }
    },
    [router, markAsRead]
  )

  /**
   * Calculate unread count from current notifications
   */
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.is_read && !n.archived).length
  }, [notifications])

  /**
   * Refresh notifications from server
   */
  const refresh = useCallback(async () => {
    await fetchNotifications()
  }, [fetchNotifications])

  // Initial fetch
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Real-time subscription
  useEffect(() => {
    if (!enableRealtime || !user?.id) return

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification
          // Only add if not archived (we're showing non-archived by default)
          if (!newNotification.archived) {
            setNotifications((prev) => [newNotification, ...prev])
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updatedNotification = payload.new as Notification
          setNotifications((prev) => {
            // If notification was archived, remove it from the list
            if (updatedNotification.archived) {
              return prev.filter((n) => n.id !== updatedNotification.id)
            }
            // Otherwise update it
            return prev.map((n) =>
              n.id === updatedNotification.id ? updatedNotification : n
            )
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const deletedNotification = payload.old as Notification
          setNotifications((prev) =>
            prev.filter((n) => n.id !== deletedNotification.id)
          )
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [enableRealtime, user?.id, supabase])

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllRead,
    archive,
    unarchive,
    archiveAll,
    refresh,
    navigateToEntity,
  }
}
