/**
 * BottomTabs Component - Mobile Navigation
 *
 * Fixed bottom navigation bar for mobile devices with:
 * - Floating pill design with subtle shadow
 * - Navigation items with active route highlighting
 * - Smooth animations for active indicator
 * - Dark mode support
 *
 * Created: 2026-02-10 - MV2-013 Protected Layout Shell
 * Updated: 2026-03-13 - CHAT-004 Added Asistente IA navigation tab
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  FileBarChart,
  Bot,
  Settings,
} from 'lucide-react'

import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/patients', label: 'Pacientes', icon: Users },
  { href: '/reports', label: 'Reportes', icon: FileBarChart },
  { href: '/chat', label: 'Asistente', icon: Bot },
  { href: '/settings', label: 'Ajustes', icon: Settings },
]

export function BottomTabs() {
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 md:hidden',
        'pb-[env(safe-area-inset-bottom)]'
      )}
    >
      {/* Gradient fade effect at the top */}
      <div className="pointer-events-none absolute -top-8 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent" />

      {/* Main navigation container */}
      <div className="mx-3 mb-3">
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          className={cn(
            'flex items-center justify-around rounded-2xl px-2 py-2',
            'bg-card/80 backdrop-blur-xl',
            'border border-border/50',
            'shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12),0_4px_16px_-4px_rgba(0,0,0,0.08)]',
            'dark:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.4),0_4px_16px_-4px_rgba(0,0,0,0.3)]'
          )}
        >
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex flex-1 flex-col items-center gap-1 rounded-xl px-3 py-2 transition-colors duration-200',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {/* Active background pill */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 rounded-xl bg-primary/10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}

                {/* Icon with scale animation */}
                <motion.div
                  initial={false}
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    y: isActive ? -2 : 0,
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="relative z-10"
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 transition-colors duration-200',
                      isActive && 'text-primary'
                    )}
                  />
                </motion.div>

                {/* Label with fade animation */}
                <motion.span
                  initial={false}
                  animate={{
                    opacity: isActive ? 1 : 0.7,
                    fontWeight: isActive ? 600 : 500,
                  }}
                  className={cn(
                    'relative z-10 text-[10px] leading-tight',
                    isActive && 'text-primary'
                  )}
                >
                  {item.label}
                </motion.span>

                {/* Active dot indicator */}
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-primary"
                  />
                )}
              </Link>
            )
          })}
        </motion.div>
      </div>
    </nav>
  )
}
