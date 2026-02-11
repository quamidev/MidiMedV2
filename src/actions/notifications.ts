'use server'

/**
 * Notification Server Actions
 *
 * Handles notification management: fetching, read/unread status, archiving,
 * and creating tenant-wide notifications. All operations are scoped to the
 * authenticated user.
 *
 * Created: 2026-02-10 - MV2-035 Notification server actions
 */

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type {
  ActionResult,
  Notification,
  GetNotificationsParams,
  GetNotificationsResult,
  CreateTenantNotificationInput,
  NotificationType,
  NotificationMetadata,
} from '@/types/app'

// =============================================================================
// Validation Schemas
// =============================================================================

const getNotificationsSchema = z.object({
  archived: z.boolean().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
})

const createTenantNotificationSchema = z.object({
  title: z.string().min(1, 'El titulo es requerido'),
  body: z.string().min(1, 'El contenido es requerido'),
  type: z
    .enum([
      'general',
      'appointment_created',
      'appointment_cancelled',
      'appointment_reminder',
      'patient_created',
      'medical_record_created',
      'team_invite',
      'billing_alert',
    ])
    .optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  expiresAt: z.string().datetime().optional(),
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
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    throw new Error('No autenticado')
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, tenant_id')
    .eq('auth_id', authUser.id)
    .single()

  if (userError || !user) {
    throw new Error('Usuario no encontrado')
  }

  return { supabase, user, tenantId: user.tenant_id as string, userId: user.id as string }
}

// =============================================================================
// Read Actions
// =============================================================================

/**
 * Gets a paginated list of notifications for the current user.
 * Supports filtering by archived status.
 *
 * @param params - Pagination and filter parameters
 * @returns ActionResult with notifications array, total count, and unread count
 */
export async function getNotifications(
  params: GetNotificationsParams = {}
): Promise<ActionResult<GetNotificationsResult>> {
  try {
    const validated = getNotificationsSchema.parse(params)
    const { archived, limit, offset } = validated

    const { supabase, userId, tenantId } = await getCurrentUserContext()

    // Build query for notifications
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)

    // Filter by archived status if specified
    if (archived !== undefined) {
      query = query.eq('archived', archived)
    }

    // Apply ordering and pagination
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

    const { data: notifications, error, count } = await query

    if (error) {
      console.error('getNotifications error:', error)
      return { success: false, error: 'Error al obtener notificaciones' }
    }

    // Get unread count separately (non-archived, unread)
    const { count: unreadCount, error: unreadError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .eq('is_read', false)
      .eq('archived', false)

    if (unreadError) {
      console.error('getNotifications unread count error:', unreadError)
    }

    return {
      success: true,
      data: {
        notifications: (notifications || []) as Notification[],
        total: count || 0,
        unreadCount: unreadCount || 0,
      },
    }
  } catch (error) {
    console.error('getNotifications error:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Parametros invalidos' }
    }
    if (error instanceof Error && error.message === 'No autenticado') {
      return { success: false, error: 'No autenticado' }
    }
    return { success: false, error: 'Error inesperado' }
  }
}

// =============================================================================
// Single Notification Actions
// =============================================================================

/**
 * Marks a single notification as read.
 *
 * @param notificationId - The notification's UUID
 * @returns ActionResult with the updated notification
 */
export async function markAsRead(notificationId: string): Promise<ActionResult<Notification>> {
  try {
    if (!notificationId) {
      return { success: false, error: 'ID de notificacion requerido' }
    }

    const { supabase, userId, tenantId } = await getCurrentUserContext()

    // Verify ownership and update
    const { data: notification, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) {
      console.error('markAsRead error:', error)
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Notificacion no encontrada' }
      }
      return { success: false, error: 'Error al marcar como leida' }
    }

    revalidatePath('/notifications')

    return {
      success: true,
      data: notification as Notification,
    }
  } catch (error) {
    console.error('markAsRead error:', error)
    if (error instanceof Error && error.message === 'No autenticado') {
      return { success: false, error: 'No autenticado' }
    }
    return { success: false, error: 'Error inesperado' }
  }
}

/**
 * Marks a single notification as unread.
 *
 * @param notificationId - The notification's UUID
 * @returns ActionResult with the updated notification
 */
export async function markAsUnread(notificationId: string): Promise<ActionResult<Notification>> {
  try {
    if (!notificationId) {
      return { success: false, error: 'ID de notificacion requerido' }
    }

    const { supabase, userId, tenantId } = await getCurrentUserContext()

    // Verify ownership and update
    const { data: notification, error } = await supabase
      .from('notifications')
      .update({ is_read: false })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) {
      console.error('markAsUnread error:', error)
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Notificacion no encontrada' }
      }
      return { success: false, error: 'Error al marcar como no leida' }
    }

    revalidatePath('/notifications')

    return {
      success: true,
      data: notification as Notification,
    }
  } catch (error) {
    console.error('markAsUnread error:', error)
    if (error instanceof Error && error.message === 'No autenticado') {
      return { success: false, error: 'No autenticado' }
    }
    return { success: false, error: 'Error inesperado' }
  }
}

/**
 * Archives a single notification.
 * Archived notifications are hidden from the main list but preserved for history.
 *
 * @param notificationId - The notification's UUID
 * @returns ActionResult with the updated notification
 */
export async function archiveNotification(
  notificationId: string
): Promise<ActionResult<Notification>> {
  try {
    if (!notificationId) {
      return { success: false, error: 'ID de notificacion requerido' }
    }

    const { supabase, userId, tenantId } = await getCurrentUserContext()

    // Verify ownership and update
    const { data: notification, error } = await supabase
      .from('notifications')
      .update({ archived: true })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) {
      console.error('archiveNotification error:', error)
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Notificacion no encontrada' }
      }
      return { success: false, error: 'Error al archivar notificacion' }
    }

    revalidatePath('/notifications')

    return {
      success: true,
      data: notification as Notification,
    }
  } catch (error) {
    console.error('archiveNotification error:', error)
    if (error instanceof Error && error.message === 'No autenticado') {
      return { success: false, error: 'No autenticado' }
    }
    return { success: false, error: 'Error inesperado' }
  }
}

/**
 * Unarchives a single notification.
 * Moves the notification back to the main list.
 *
 * @param notificationId - The notification's UUID
 * @returns ActionResult with the updated notification
 */
export async function unarchiveNotification(
  notificationId: string
): Promise<ActionResult<Notification>> {
  try {
    if (!notificationId) {
      return { success: false, error: 'ID de notificacion requerido' }
    }

    const { supabase, userId, tenantId } = await getCurrentUserContext()

    // Verify ownership and update
    const { data: notification, error } = await supabase
      .from('notifications')
      .update({ archived: false })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) {
      console.error('unarchiveNotification error:', error)
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Notificacion no encontrada' }
      }
      return { success: false, error: 'Error al desarchivar notificacion' }
    }

    revalidatePath('/notifications')

    return {
      success: true,
      data: notification as Notification,
    }
  } catch (error) {
    console.error('unarchiveNotification error:', error)
    if (error instanceof Error && error.message === 'No autenticado') {
      return { success: false, error: 'No autenticado' }
    }
    return { success: false, error: 'Error inesperado' }
  }
}

// =============================================================================
// Bulk Actions
// =============================================================================

/**
 * Marks all notifications for the current user as read.
 * Uses mass UPDATE for efficiency.
 *
 * @returns ActionResult with the count of updated notifications
 */
export async function markAllRead(): Promise<ActionResult<{ count: number }>> {
  try {
    const { supabase, userId, tenantId } = await getCurrentUserContext()

    // Update all unread notifications for this user
    const { data: updated, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .eq('is_read', false)
      .select('id')

    if (error) {
      console.error('markAllRead error:', error)
      return { success: false, error: 'Error al marcar todas como leidas' }
    }

    revalidatePath('/notifications')

    return {
      success: true,
      data: { count: updated?.length || 0 },
    }
  } catch (error) {
    console.error('markAllRead error:', error)
    if (error instanceof Error && error.message === 'No autenticado') {
      return { success: false, error: 'No autenticado' }
    }
    return { success: false, error: 'Error inesperado' }
  }
}

/**
 * Archives all notifications for the current user.
 * Uses mass UPDATE for efficiency.
 *
 * @returns ActionResult with the count of archived notifications
 */
export async function archiveAll(): Promise<ActionResult<{ count: number }>> {
  try {
    const { supabase, userId, tenantId } = await getCurrentUserContext()

    // Archive all non-archived notifications for this user
    const { data: updated, error } = await supabase
      .from('notifications')
      .update({ archived: true })
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .eq('archived', false)
      .select('id')

    if (error) {
      console.error('archiveAll error:', error)
      return { success: false, error: 'Error al archivar todas las notificaciones' }
    }

    revalidatePath('/notifications')

    return {
      success: true,
      data: { count: updated?.length || 0 },
    }
  } catch (error) {
    console.error('archiveAll error:', error)
    if (error instanceof Error && error.message === 'No autenticado') {
      return { success: false, error: 'No autenticado' }
    }
    return { success: false, error: 'Error inesperado' }
  }
}

// =============================================================================
// Internal Helper Actions
// =============================================================================

/**
 * Creates a notification for all users in a tenant.
 * This is an internal helper function used by triggers and other server actions.
 * Uses admin client to bypass RLS and create notifications for all tenant users.
 *
 * @param tenantId - The tenant's ID
 * @param input - Notification content
 * @returns ActionResult with array of created notification IDs
 */
export async function createTenantNotification(
  tenantId: string,
  input: CreateTenantNotificationInput
): Promise<ActionResult<{ notificationIds: string[] }>> {
  try {
    if (!tenantId) {
      return { success: false, error: 'Tenant ID requerido' }
    }

    const validated = createTenantNotificationSchema.parse(input)
    const now = new Date().toISOString()

    // Fetch all users in the tenant using admin client
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('tenant_id', tenantId)

    if (usersError) {
      console.error('createTenantNotification users error:', usersError)
      return { success: false, error: 'Error al obtener usuarios del tenant' }
    }

    if (!users || users.length === 0) {
      return {
        success: true,
        data: { notificationIds: [] },
      }
    }

    // Prepare notification records for all users
    const notificationType = validated.type || 'general'
    const notifications = users.map((user) => ({
      tenant_id: tenantId,
      user_id: user.id,
      title: validated.title,
      body: validated.body,
      type: notificationType as NotificationType,
      metadata: (validated.metadata || {}) as NotificationMetadata,
      is_read: false,
      archived: false,
      created_at: now,
      expires_at: validated.expiresAt || null,
    }))

    // Insert all notifications in a single batch
    const { data: created, error: insertError } = await supabaseAdmin
      .from('notifications')
      .insert(notifications)
      .select('id')

    if (insertError) {
      console.error('createTenantNotification insert error:', insertError)
      return { success: false, error: 'Error al crear notificaciones' }
    }

    const notificationIds = (created || []).map((n) => n.id as string)

    return {
      success: true,
      data: { notificationIds },
    }
  } catch (error) {
    console.error('createTenantNotification error:', error)
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError
      return { success: false, error: zodError.issues[0]?.message ?? 'Datos invalidos' }
    }
    return { success: false, error: 'Error inesperado' }
  }
}

/**
 * Creates a notification for a specific user.
 * This is an internal helper function used by triggers and other server actions.
 * Uses admin client to bypass RLS.
 *
 * @param userId - The user's ID
 * @param tenantId - The tenant's ID
 * @param input - Notification content
 * @returns ActionResult with the created notification
 */
export async function createUserNotification(
  userId: string,
  tenantId: string,
  input: CreateTenantNotificationInput
): Promise<ActionResult<Notification>> {
  try {
    if (!userId || !tenantId) {
      return { success: false, error: 'User ID y Tenant ID son requeridos' }
    }

    const validated = createTenantNotificationSchema.parse(input)
    const now = new Date().toISOString()
    const notificationType = validated.type || 'general'

    const notificationData = {
      tenant_id: tenantId,
      user_id: userId,
      title: validated.title,
      body: validated.body,
      type: notificationType as NotificationType,
      metadata: (validated.metadata || {}) as NotificationMetadata,
      is_read: false,
      archived: false,
      created_at: now,
      expires_at: validated.expiresAt || null,
    }

    const { data: notification, error } = await supabaseAdmin
      .from('notifications')
      .insert(notificationData)
      .select()
      .single()

    if (error) {
      console.error('createUserNotification error:', error)
      return { success: false, error: 'Error al crear notificacion' }
    }

    return {
      success: true,
      data: notification as Notification,
    }
  } catch (error) {
    console.error('createUserNotification error:', error)
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError
      return { success: false, error: zodError.issues[0]?.message ?? 'Datos invalidos' }
    }
    return { success: false, error: 'Error inesperado' }
  }
}
