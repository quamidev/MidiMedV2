'use server'

/**
 * Team Server Actions
 *
 * Handles team member (user) operations for the current tenant.
 * Used for provider selection in filters, appointment creation, etc.
 * Includes team invitation management with admin-only operations.
 *
 * Created: 2026-02-10 - MV2-026 Calendar Filters
 * Updated: 2026-02-10 - MV2-041 Added inviteUser and getPendingInvites
 */

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { ActionResult, User, Invite, UserRole } from '@/types/app'

// =============================================================================
// Validation Schemas
// =============================================================================

const inviteUserSchema = z.object({
  email: z.string().email('Correo electronico invalido'),
  role: z.enum(['admin', 'provider', 'staff'], { message: 'Rol invalido' }),
  displayName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
})

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Gets the current user and their tenant_id from the authenticated session.
 * Throws an error if not authenticated.
 */
async function getCurrentUserContext() {
  const supabase = await createServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    throw new Error('No autenticado')
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, tenant_id, role')
    .eq('auth_id', authUser.id)
    .single()

  if (userError || !user) {
    throw new Error('Usuario no encontrado')
  }

  return {
    supabase,
    user,
    tenantId: user.tenant_id as string,
    userId: user.id as string,
    role: user.role as UserRole,
  }
}

/**
 * Verifies the current user has admin role.
 * Throws an error if not admin.
 */
function requireAdmin(role: UserRole) {
  if (role !== 'admin') {
    throw new Error('Permisos insuficientes')
  }
}

/**
 * Generates a temporary password in format "Temp-XXXXXX"
 * where XXXXXX is a 6-digit random number.
 */
function generateTempPassword(): string {
  const randomDigits = Math.floor(100000 + Math.random() * 900000).toString()
  return `Temp-${randomDigits}`
}

// =============================================================================
// Query Actions
// =============================================================================

/**
 * Gets all team members (users) for the current tenant.
 * Returns users ordered by display_name.
 *
 * @returns ActionResult with array of User records
 */
export async function getTeamMembers(): Promise<ActionResult<User[]>> {
  try {
    const { supabase, tenantId } = await getCurrentUserContext()

    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('display_name', { ascending: true })

    if (error) {
      console.error('getTeamMembers error:', error)
      return { success: false, error: 'Error al obtener el equipo' }
    }

    return {
      success: true,
      data: (users || []) as User[],
    }
  } catch (error) {
    console.error('getTeamMembers error:', error)
    if (error instanceof Error && error.message === 'No autenticado') {
      return { success: false, error: 'No autenticado' }
    }
    return { success: false, error: 'Error inesperado' }
  }
}

/**
 * Gets all providers (users with provider role) for the current tenant.
 * Returns users ordered by display_name.
 *
 * @returns ActionResult with array of User records
 */
export async function getProviders(): Promise<ActionResult<User[]>> {
  try {
    const { supabase, tenantId } = await getCurrentUserContext()

    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('tenant_id', tenantId)
      .in('role', ['admin', 'provider']) // Admins can also be providers
      .order('display_name', { ascending: true })

    if (error) {
      console.error('getProviders error:', error)
      return { success: false, error: 'Error al obtener proveedores' }
    }

    return {
      success: true,
      data: (users || []) as User[],
    }
  } catch (error) {
    console.error('getProviders error:', error)
    if (error instanceof Error && error.message === 'No autenticado') {
      return { success: false, error: 'No autenticado' }
    }
    return { success: false, error: 'Error inesperado' }
  }
}

// =============================================================================
// Invitation Actions (Admin Only)
// =============================================================================

/**
 * Invites a new user to the tenant's team.
 * Admin-only operation.
 *
 * Flow:
 * 1. Generate temporary password (Temp-XXXXXX format)
 * 2. Create Supabase Auth user with email + temp password
 * 3. Create invite record (expires in 30 days)
 *
 * The invited user will need to use the temp password to accept the invitation
 * and set their own password.
 *
 * @param input - Invitation details (email, role, displayName)
 * @returns ActionResult with created invite and temporary password
 */
export async function inviteUser(
  input: { email: string; role: UserRole; displayName: string }
): Promise<ActionResult<{ invite: Invite; tempPassword: string }>> {
  try {
    const validated = inviteUserSchema.parse(input)
    const { tenantId, userId, role } = await getCurrentUserContext()

    requireAdmin(role)

    // Check if user already exists in this tenant
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', validated.email)
      .eq('tenant_id', tenantId)
      .single()

    if (existingUser) {
      return { success: false, error: 'Este usuario ya pertenece a la organizacion' }
    }

    // Check if there's already a pending invite for this email
    const { data: existingInvite } = await supabaseAdmin
      .from('invites')
      .select('id')
      .eq('email', validated.email)
      .eq('tenant_id', tenantId)
      .eq('status', 'pending')
      .single()

    if (existingInvite) {
      return { success: false, error: 'Ya existe una invitacion pendiente para este correo' }
    }

    // Generate temporary password
    const tempPassword = generateTempPassword()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days

    // Create Supabase Auth user with temp password
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: validated.email,
      password: tempPassword,
      email_confirm: true, // Skip email verification - they'll verify via invite flow
      user_metadata: {
        display_name: validated.displayName,
        tenant_id: tenantId,
        is_invited: true,
      },
    })

    if (authError || !authData.user) {
      console.error('inviteUser auth error:', authError)
      if (authError?.message?.includes('already registered')) {
        return { success: false, error: 'Este correo ya esta registrado en el sistema' }
      }
      return { success: false, error: 'Error al crear usuario. Intenta de nuevo.' }
    }

    // Create invite record
    const inviteData = {
      tenant_id: tenantId,
      email: validated.email,
      display_name: validated.displayName,
      role: validated.role,
      invited_by: userId,
      temp_password: tempPassword,
      status: 'pending' as const,
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    }

    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('invites')
      .insert(inviteData)
      .select()
      .single()

    if (inviteError || !invite) {
      console.error('inviteUser invite error:', inviteError)
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return { success: false, error: 'Error al crear invitacion. Intenta de nuevo.' }
    }

    revalidatePath('/settings')

    return {
      success: true,
      data: {
        invite: invite as Invite,
        tempPassword,
      },
    }
  } catch (error) {
    console.error('inviteUser error:', error)
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError
      return { success: false, error: zodError.issues[0]?.message ?? 'Datos invalidos' }
    }
    if (error instanceof Error) {
      if (error.message === 'No autenticado') {
        return { success: false, error: 'No autenticado' }
      }
      if (error.message === 'Permisos insuficientes') {
        return { success: false, error: 'Solo administradores pueden invitar usuarios' }
      }
    }
    return { success: false, error: 'Error inesperado' }
  }
}

/**
 * Gets all pending invitations for the current tenant.
 * Admin-only operation.
 * Returns invites ordered by created_at descending.
 *
 * @returns ActionResult with array of Invite records
 */
export async function getPendingInvites(): Promise<ActionResult<Invite[]>> {
  try {
    const { supabase, tenantId, role } = await getCurrentUserContext()

    requireAdmin(role)

    const { data: invites, error } = await supabase
      .from('invites')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('getPendingInvites error:', error)
      return { success: false, error: 'Error al obtener invitaciones' }
    }

    return {
      success: true,
      data: (invites || []) as Invite[],
    }
  } catch (error) {
    console.error('getPendingInvites error:', error)
    if (error instanceof Error) {
      if (error.message === 'No autenticado') {
        return { success: false, error: 'No autenticado' }
      }
      if (error.message === 'Permisos insuficientes') {
        return { success: false, error: 'Solo administradores pueden ver invitaciones' }
      }
    }
    return { success: false, error: 'Error inesperado' }
  }
}
