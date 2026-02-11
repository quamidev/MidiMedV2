/**
 * Team Settings Component
 *
 * Admin-only team management interface with member table,
 * invite functionality, pending invitations, and provider color picker.
 *
 * Created: 2026-02-10 - MV2-042 Team Management UI
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Users, UserPlus, RefreshCw } from 'lucide-react'

import { useUser } from '@/hooks/use-user'
import { getTeamMembers, getPendingInvites } from '@/actions/team'
import type { User, Invite } from '@/types/app'
import { Button } from '@/components/ui/button'
import { TeamTable } from './team-table'
import { InviteModal } from './invite-modal'

// =============================================================================
// Component
// =============================================================================

export function TeamSettings() {
  const { user, refreshUser } = useUser()
  const [members, setMembers] = useState<User[]>([])
  const [pendingInvites, setPendingInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)

  // ==========================================================================
  // Data Loading
  // ==========================================================================

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [membersResult, invitesResult] = await Promise.all([
        getTeamMembers(),
        getPendingInvites(),
      ])

      if (membersResult.success) {
        setMembers(membersResult.data)
      } else {
        toast.error(membersResult.error)
      }

      if (invitesResult.success) {
        setPendingInvites(invitesResult.data)
      }
    } catch (error) {
      console.error('Load team data error:', error)
      toast.error('Error al cargar el equipo')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ==========================================================================
  // Handlers
  // ==========================================================================

  const handleInviteCreated = useCallback(() => {
    loadData()
    refreshUser()
  }, [loadData, refreshUser])

  const handleColorUpdated = useCallback(() => {
    loadData()
  }, [loadData])

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl border border-border bg-card overflow-hidden"
      >
        <div className="border-b border-border bg-muted/30 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Equipo</h2>
                <p className="text-xs text-muted-foreground">
                  {members.length} miembro{members.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                size="sm"
                onClick={() => setInviteModalOpen(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Invitar Miembro</span>
                <span className="sm:hidden">Invitar</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Team Table */}
        <div className="p-6">
          <TeamTable
            members={members}
            loading={loading}
            currentUserId={user?.id}
            onColorUpdated={handleColorUpdated}
          />
        </div>
      </motion.div>

      {/* Pending Invitations */}
      {pendingInvites.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="rounded-2xl border border-border bg-card overflow-hidden"
        >
          <div className="border-b border-border bg-muted/30 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10">
                <UserPlus className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">
                  Invitaciónes pendientes
                </h2>
                <p className="text-xs text-muted-foreground">
                  {pendingInvites.length} invitación{pendingInvites.length !== 1 ? 'es' : ''} sin aceptar
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-3">
              {pendingInvites.map((invite, index) => (
                <motion.div
                  key={invite.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-foreground truncate">
                      {invite.display_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {invite.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium capitalize">
                      {invite.role}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      Expira:{' '}
                      {new Date(invite.expires_at).toLocaleDateString('es-GT', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Invite Modal */}
      <InviteModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onInvited={handleInviteCreated}
      />
    </div>
  )
}
