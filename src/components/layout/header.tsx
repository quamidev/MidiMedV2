/**
 * Header Component - Mobile Top Bar
 *
 * Mobile header with:
 * - App logo/brand
 * - Notification bell with badge
 * - User avatar
 * - Dark mode toggle
 * - Backdrop blur effect
 *
 * Created: 2026-02-10 - MV2-013 Protected Layout Shell
 * Updated: 2026-02-10 - QA-008 Replaced hardcoded notification count with real data from useNotifications
 */

'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Bell, Moon, Sun } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useUser } from '@/hooks/use-user'
import { useTheme } from '@/contexts/theme-context'
import { useNotifications } from '@/hooks/use-notifications'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function Header() {
  const { user } = useUser()
  const { theme, toggleTheme } = useTheme()
  const { unreadCount: notificationCount } = useNotifications({ limit: 20, enableRealtime: true })

  return (
    <header
      className={cn(
        'fixed left-0 right-0 top-0 z-50 md:hidden',
        'pt-[env(safe-area-inset-top)]'
      )}
    >
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        className={cn(
          'flex h-14 items-center justify-between px-4',
          'bg-background/80 backdrop-blur-xl',
          'border-b border-border/50',
          'shadow-[0_4px_16px_-4px_rgba(0,0,0,0.06)]',
          'dark:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.2)]'
        )}
      >
        {/* Logo/Brand */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <span className="text-base font-bold text-primary">M</span>
          </div>
          <span className="text-base font-semibold tracking-tight text-foreground">
            MidiMed
          </span>
        </Link>

        {/* Right Actions */}
        <div className="flex items-center gap-1">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9 rounded-full"
          >
            <motion.div
              initial={false}
              animate={{ rotate: theme === 'dark' ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {theme === 'dark' ? (
                <Moon className="h-4.5 w-4.5 text-muted-foreground" />
              ) : (
                <Sun className="h-4.5 w-4.5 text-muted-foreground" />
              )}
            </motion.div>
          </Button>

          {/* Notifications */}
          <Link href="/notifications">
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 rounded-full"
            >
              <Bell className="h-4.5 w-4.5 text-muted-foreground" />
              {notificationCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground"
                >
                  {notificationCount > 9 ? '9+' : notificationCount}
                </motion.span>
              )}
            </Button>
          </Link>

          {/* User Avatar with Dropdown */}
          <div className="ml-1 flex items-center gap-2">
            <Link href="/settings">
              <Avatar className="h-8 w-8 border-2 border-border transition-all duration-200 hover:border-primary">
                <AvatarImage
                  src={user?.avatar_url || undefined}
                  alt={user?.display_name || 'Usuario'}
                />
                <AvatarFallback className="bg-muted text-xs font-medium">
                  {user?.display_name ? getInitials(user.display_name) : 'U'}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </motion.div>
    </header>
  )
}
