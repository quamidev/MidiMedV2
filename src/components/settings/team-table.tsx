/**
 * Team Table Component
 *
 * Displays team members in a table with name, email, role badge,
 * calendar color picker, and last login. Responsive design with
 * card layout on mobile.
 *
 * Created: 2026-02-10 - MV2-042 Team Management UI
 */

'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { User as UserIcon, Shield, Stethoscope, Clipboard } from 'lucide-react'

import { cn } from '@/lib/utils'
import { updateProviderColor } from '@/actions/settings'
import type { User, UserRole } from '@/types/app'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { ColorPicker } from './color-picker'

// =============================================================================
// Types
// =============================================================================

interface TeamTableProps {
  members: User[]
  loading: boolean
  currentUserId?: string
  onColorUpdated: () => void
}

// =============================================================================
// Role Configuration
// =============================================================================

const ROLE_CONFIG: Record<UserRole, { label: string; icon: React.ElementType; className: string }> = {
  admin: {
    label: 'Admin',
    icon: Shield,
    className: 'bg-primary/10 text-primary',
  },
  provider: {
    label: 'Proveedor',
    icon: Stethoscope,
    className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  staff: {
    label: 'Staff',
    icon: Clipboard,
    className: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
  },
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// =============================================================================
// Component
// =============================================================================

export function TeamTable({
  members,
  loading,
  currentUserId,
  onColorUpdated,
}: TeamTableProps) {
  const [updatingColor, setUpdatingColor] = useState<string | null>(null)

  const handleColorChange = useCallback(
    async (userId: string, color: string) => {
      setUpdatingColor(userId)
      try {
        const result = await updateProviderColor({ userId, color })

        if (result.success) {
          toast.success('Color actualizado')
          onColorUpdated()
        } else {
          toast.error(result.error)
        }
      } catch (error) {
        console.error('Update color error:', error)
        toast.error('Error al actualizar color')
      } finally {
        setUpdatingColor(null)
      }
    },
    [onColorUpdated]
  )

  if (loading) {
    return <TeamTableSkeleton />
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <UserIcon className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          No hay miembros en el equipo
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold">Miembro</TableHead>
              <TableHead className="font-semibold">Rol</TableHead>
              <TableHead className="font-semibold">Color</TableHead>
              <TableHead className="font-semibold text-right">Ultimo acceso</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member, index) => {
              const roleConfig = ROLE_CONFIG[member.role]
              const RoleIcon = roleConfig.icon
              const isCurrentUser = member.id === currentUserId

              return (
                <motion.tr
                  key={member.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  className="group hover:bg-muted/30 transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-border">
                        <AvatarImage
                          src={member.avatar_url || undefined}
                          alt={member.display_name}
                        />
                        <AvatarFallback className="bg-muted text-sm font-medium">
                          {getInitials(member.display_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">
                          {member.display_name}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              (tu)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {member.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium',
                        roleConfig.className
                      )}
                    >
                      <RoleIcon className="h-3 w-3" />
                      {roleConfig.label}
                    </span>
                  </TableCell>
                  <TableCell>
                    <ColorPicker
                      color={member.color || '#3abdd4'}
                      onChange={(color) => handleColorChange(member.id, color)}
                      disabled={updatingColor === member.id}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-sm text-muted-foreground">
                      {member.last_login_at
                        ? formatDistanceToNow(new Date(member.last_login_at), {
                            addSuffix: true,
                            locale: es,
                          })
                        : 'Nunca'}
                    </span>
                  </TableCell>
                </motion.tr>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {members.map((member, index) => {
          const roleConfig = ROLE_CONFIG[member.role]
          const RoleIcon = roleConfig.icon
          const isCurrentUser = member.id === currentUserId

          return (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
              className="p-4 rounded-xl bg-muted/50 border border-border/50 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-border">
                    <AvatarImage
                      src={member.avatar_url || undefined}
                      alt={member.display_name}
                    />
                    <AvatarFallback className="bg-muted text-sm font-medium">
                      {getInitials(member.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-foreground">
                      {member.display_name}
                      {isCurrentUser && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          (tu)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {member.email}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium',
                    roleConfig.className
                  )}
                >
                  <RoleIcon className="h-3 w-3" />
                  {roleConfig.label}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Color:</span>
                  <ColorPicker
                    color={member.color || '#3abdd4'}
                    onChange={(color) => handleColorChange(member.id, color)}
                    disabled={updatingColor === member.id}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {member.last_login_at
                    ? formatDistanceToNow(new Date(member.last_login_at), {
                        addSuffix: true,
                        locale: es,
                      })
                    : 'Nunca'}
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </>
  )
}

// =============================================================================
// Skeleton
// =============================================================================

function TeamTableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-4 rounded-xl bg-muted/30"
        >
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-6 w-16 rounded-lg" />
        </div>
      ))}
    </div>
  )
}
