/**
 * Sidebar Component - Desktop Navigation
 *
 * Collapsible sidebar for desktop navigation with:
 * - Smooth expand/collapse animation (256px expanded / 64px collapsed)
 * - Navigation items with active route highlighting
 * - User avatar and profile section
 * - Notification bell with badge
 * - Dark mode support
 * - localStorage persistence for collapse state via SidebarContext
 *
 * Created: 2026-02-10 - MV2-013 Protected Layout Shell
 */

'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  FileBarChart,
  Settings,
  Bell,
  ChevronLeft,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { useUser } from '@/hooks/use-user'
import { useTheme } from '@/contexts/theme-context'
import { useSidebar } from '@/contexts/sidebar-context'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/patients', label: 'Pacientes', icon: Users },
  { href: '/reports', label: 'Reportes', icon: FileBarChart },
  { href: '/settings', label: 'Configuracion', icon: Settings },
]

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function Sidebar() {
  const pathname = usePathname()
  const { user, tenant, signOut } = useUser()
  const { theme, toggleTheme } = useTheme()
  const { collapsed, toggleCollapsed } = useSidebar()

  const handleSignOut = useCallback(async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Failed to sign out:', error)
    }
  }, [signOut])

  // Placeholder notification count
  const notificationCount = 3

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 64 : 256 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className={cn(
          'fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-sidebar-border bg-sidebar-background md:flex',
          'shadow-[4px_0_24px_-8px_rgba(0,0,0,0.08)] dark:shadow-[4px_0_24px_-8px_rgba(0,0,0,0.24)]'
        )}
      >
        {/* Logo/Brand Section */}
        <div className="flex h-16 items-center justify-between px-4">
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <span className="text-lg font-bold text-primary">M</span>
                </div>
                <span className="text-lg font-semibold tracking-tight text-sidebar-foreground">
                  MidiMed
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {collapsed && (
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <span className="text-lg font-bold text-primary">M</span>
            </div>
          )}
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icon = item.icon

            const navLink = (
              <Link
                href={item.href}
                className={cn(
                  'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-primary/10 text-sidebar-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  collapsed && 'justify-center px-2'
                )}
              >
                {/* Active indicator glow */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 rounded-lg bg-sidebar-primary/10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}

                {/* Active indicator bar */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      exit={{ scaleY: 0 }}
                      className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-sidebar-primary"
                    />
                  )}
                </AnimatePresence>

                <Icon
                  className={cn(
                    'relative z-10 h-5 w-5 shrink-0 transition-transform duration-200',
                    isActive && 'text-sidebar-primary',
                    'group-hover:scale-110'
                  )}
                />

                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.15 }}
                      className="relative z-10"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            )

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{navLink}</TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return <div key={item.href}>{navLink}</div>
          })}
        </nav>

        {/* Bottom Section */}
        <div className="mt-auto space-y-2 px-2 pb-4">
          <Separator className="bg-sidebar-border" />

          {/* Notification Bell */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/notifications"
                className={cn(
                  'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  collapsed && 'justify-center px-2'
                )}
              >
                <div className="relative">
                  <Bell className="h-5 w-5" />
                  {notificationCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground"
                    >
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </motion.span>
                  )}
                </div>
                <AnimatePresence mode="wait">
                  {!collapsed && (
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
              </Link>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" className="font-medium">
                Notificaciones
                {notificationCount > 0 && (
                  <span className="ml-1 text-destructive">
                    ({notificationCount})
                  </span>
                )}
              </TooltipContent>
            )}
          </Tooltip>

          {/* Theme Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleTheme}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  collapsed && 'justify-center px-2'
                )}
              >
                <motion.div
                  initial={false}
                  animate={{ rotate: theme === 'dark' ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {theme === 'dark' ? (
                    <Moon className="h-5 w-5" />
                  ) : (
                    <Sun className="h-5 w-5" />
                  )}
                </motion.div>
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.15 }}
                    >
                      {theme === 'dark' ? 'Modo oscuro' : 'Modo claro'}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" className="font-medium">
                {theme === 'dark' ? 'Modo oscuro' : 'Modo claro'}
              </TooltipContent>
            )}
          </Tooltip>

          <Separator className="bg-sidebar-border" />

          {/* User Profile Section */}
          <div
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2',
              collapsed && 'justify-center px-2'
            )}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 border-2 border-sidebar-border transition-all duration-200 hover:border-sidebar-primary">
                    <AvatarImage
                      src={user?.avatar_url || undefined}
                      alt={user?.display_name || 'Usuario'}
                    />
                    <AvatarFallback className="bg-sidebar-accent text-sm font-medium text-sidebar-accent-foreground">
                      {user?.display_name
                        ? getInitials(user.display_name)
                        : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <AnimatePresence mode="wait">
                    {!collapsed && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.15 }}
                        className="flex min-w-0 flex-col"
                      >
                        <span className="truncate text-sm font-medium text-sidebar-foreground">
                          {user?.display_name || 'Usuario'}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {tenant?.name || 'Clinica'}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" className="font-medium">
                  <div className="flex flex-col">
                    <span>{user?.display_name || 'Usuario'}</span>
                    <span className="text-xs text-muted-foreground">
                      {tenant?.name || 'Clinica'}
                    </span>
                  </div>
                </TooltipContent>
              )}
            </Tooltip>
          </div>

          {/* Sign Out Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleSignOut}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-all duration-200 hover:bg-destructive/10 hover:text-destructive',
                  collapsed && 'justify-center px-2'
                )}
              >
                <LogOut className="h-5 w-5" />
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.15 }}
                    >
                      Cerrar sesion
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" className="font-medium">
                Cerrar sesion
              </TooltipContent>
            )}
          </Tooltip>
        </div>

        {/* Collapse Toggle Button */}
        <div className="absolute -right-3 top-20">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleCollapsed}
                className="h-6 w-6 rounded-full border-sidebar-border bg-sidebar-background shadow-md hover:bg-sidebar-accent"
              >
                <motion.div
                  animate={{ rotate: collapsed ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </motion.div>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {collapsed ? 'Expandir' : 'Contraer'}
            </TooltipContent>
          </Tooltip>
        </div>
      </motion.aside>
    </TooltipProvider>
  )
}
