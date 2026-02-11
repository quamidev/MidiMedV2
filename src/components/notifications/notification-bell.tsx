/**
 * Notification Bell Component
 *
 * Bell icon button with unread count badge. Handles both desktop (popover)
 * and mobile (modal) interaction patterns.
 *
 * Features:
 * - Animated bell on new notifications
 * - Badge with count (9+ for > 9)
 * - Desktop: Popover on click
 * - Mobile: Full-screen modal on tap
 * - Pulse animation when there are unread notifications
 *
 * Created: 2026-02-10 - MV2-037 Notification Bell and Popover
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useNotifications } from '@/hooks/use-notifications'
import { NotificationPopover } from '@/components/notifications/notification-popover'
import { NotificationModal } from '@/components/notifications/notification-modal'

interface NotificationBellProps {
  className?: string
  /** Show label text next to bell (for expanded sidebar) */
  showLabel?: boolean
  /** Collapse mode hides the label */
  collapsed?: boolean
}

/**
 * NotificationBell component
 *
 * The main entry point for the notification system. Displays a bell icon
 * with an unread count badge and opens either a popover (desktop) or
 * modal (mobile) when clicked.
 */
export function NotificationBell({
  className,
  showLabel = false,
  collapsed = false,
}: NotificationBellProps) {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllRead,
    navigateToEntity,
  } = useNotifications({ limit: 20 })

  // Track previous unread count for animation
  const prevUnreadCount = useRef(unreadCount)
  const [shouldAnimate, setShouldAnimate] = useState(false)

  // State for popover/modal
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  // Detect if mobile (< 768px)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Animate bell when unread count increases
  useEffect(() => {
    if (unreadCount > prevUnreadCount.current) {
      setShouldAnimate(true)
      const timer = setTimeout(() => setShouldAnimate(false), 1000)
      return () => clearTimeout(timer)
    }
    prevUnreadCount.current = unreadCount
  }, [unreadCount])

  const handleClick = () => {
    if (isMobile) {
      setModalOpen(true)
    }
    // Desktop: popover handles its own open state via PopoverTrigger
  }

  const handleNotificationClick = (notification: { id: string } & Parameters<typeof navigateToEntity>[0]) => {
    if (!notification.is_read) {
      markAsRead(notification.id)
    }
    navigateToEntity(notification)
    setPopoverOpen(false)
    setModalOpen(false)
  }

  const badgeContent = unreadCount > 9 ? '9+' : unreadCount

  const bellButton = (
    <motion.button
      onClick={handleClick}
      className={cn(
        'relative flex items-center gap-3 rounded-lg text-sm font-medium transition-colors',
        'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
        collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
        className
      )}
      whileTap={{ scale: 0.95 }}
    >
      {/* Bell Icon with animation */}
      <div className="relative">
        <motion.div
          animate={
            shouldAnimate
              ? {
                  rotate: [0, -15, 15, -10, 10, -5, 5, 0],
                  transition: { duration: 0.6 },
                }
              : {}
          }
        >
          <Bell
            className={cn(
              'h-5 w-5',
              unreadCount > 0 && 'text-primary'
            )}
          />
        </motion.div>

        {/* Unread Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className={cn(
                'absolute -right-1.5 -top-1.5',
                'flex h-4 min-w-4 items-center justify-center',
                'rounded-full bg-destructive px-1',
                'text-[10px] font-bold text-destructive-foreground',
                'shadow-sm'
              )}
            >
              {badgeContent}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Pulse ring for unread notifications */}
        {unreadCount > 0 && (
          <span
            className={cn(
              'absolute -inset-1 rounded-full',
              'animate-ping bg-primary/30',
              'opacity-75'
            )}
            style={{ animationDuration: '2s' }}
          />
        )}
      </div>

      {/* Label (for expanded sidebar) */}
      <AnimatePresence mode="wait">
        {showLabel && !collapsed && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
          >
            Notificaciones
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )

  return (
    <>
      {/* Desktop: Popover */}
      {!isMobile && (
        <NotificationPopover
          notifications={notifications}
          unreadCount={unreadCount}
          loading={loading}
          onMarkAllRead={markAllRead}
          onNotificationClick={handleNotificationClick}
          open={popoverOpen}
          onOpenChange={setPopoverOpen}
        >
          {bellButton}
        </NotificationPopover>
      )}

      {/* Mobile: Just the button (modal opens on click) */}
      {isMobile && bellButton}

      {/* Mobile Modal */}
      <NotificationModal
        notifications={notifications}
        unreadCount={unreadCount}
        loading={loading}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onMarkAllRead={markAllRead}
        onNotificationClick={handleNotificationClick}
      />
    </>
  )
}
