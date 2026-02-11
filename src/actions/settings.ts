'use server'

/**
 * Settings Server Actions
 *
 * Handles organization settings, user profile, and onboarding management.
 * Includes admin-only operations for tenant configuration.
 *
 * Created: 2026-02-10 - MV2-039 Settings server actions
 */

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createServerClient } from '@/lib/supabase/server'
import type {
  ActionResult,
  Tenant,
  User,
  WorkingHours,
  CustomField,
  UserRole,
} from '@/types/app'

// =============================================================================
// Validation Schemas
// =============================================================================

const updateOrganizationSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  email: z.string().email('Correo electrónico inválido').nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
})

const workingHoursEntrySchema = z.tuple([z.string(), z.string()]).nullable()

const updateWorkingHoursSchema = z.object({
  mon: workingHoursEntrySchema,
  tue: workingHoursEntrySchema,
  wed: workingHoursEntrySchema,
  thu: workingHoursEntrySchema,
  fri: workingHoursEntrySchema,
  sat: workingHoursEntrySchema,
  sun: workingHoursEntrySchema,
})

const updateAppointmentDurationSchema = z.object({
  minutes: z.number().min(5, 'La duración mínima es 5 minutos').max(480, 'La duración máxima es 8 horas'),
})

const customFieldSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'El nombre del campo es requerido'),
  type: z.enum(['text', 'number', 'boolean', 'select', 'date']),
  options: z.array(z.string()).optional(),
  required: z.boolean().optional(),
})

const updateExtraFieldsSchema = z.object({
  extraFields: z.array(customFieldSchema),
})

const updateUserProfileSchema = z.object({
  displayName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
})

const updateProviderColorSchema = z.object({
  userId: z.string().uuid('ID de usuario inválido'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido. Debe ser formato hexadecimal (#RRGGBB)'),
})

const onboardingStepSchema = z.enum([
  'create_patient',
  'create_appointment',
  'view_appointment',
  'complete_appointment',
  'visit_settings',
])

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

// =============================================================================
// Query Actions
// =============================================================================

/**
 * Gets the tenant settings for the current user's organization.
 *
 * @returns ActionResult with tenant data
 */
export async function getTenantSettings(): Promise<ActionResult<Tenant>> {
  try {
    const { supabase, tenantId } = await getCurrentUserContext()

    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('tenant_id', tenantId)
      .single()

    if (error || !tenant) {
      console.error('getTenantSettings error:', error)
      return { success: false, error: 'Organización no encontrada' }
    }

    return {
      success: true,
      data: tenant as Tenant,
    }
  } catch (error) {
    console.error('getTenantSettings error:', error)
    if (error instanceof Error && error.message === 'No autenticado') {
      return { success: false, error: 'No autenticado' }
    }
    return { success: false, error: 'Error inesperado' }
  }
}

// =============================================================================
// Organization Settings Actions (Admin Only)
// =============================================================================

/**
 * Updates the organization profile settings.
 * Admin-only operation.
 *
 * @param input - Organization profile fields to update
 * @returns ActionResult with updated tenant data
 */
export async function updateOrganization(
  input: { name?: string; email?: string | null; phone?: string | null; address?: string | null }
): Promise<ActionResult<Tenant>> {
  try {
    const validated = updateOrganizationSchema.parse(input)
    const { supabase, tenantId, role } = await getCurrentUserContext()

    requireAdmin(role)

    const updateData = {
      ...validated,
      updated_at: new Date().toISOString(),
    }

    const { data: tenant, error } = await supabase
      .from('tenants')
      .update(updateData)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) {
      console.error('updateOrganization error:', error)
      return { success: false, error: 'Error al actualizar la organización' }
    }

    revalidatePath('/settings')

    return {
      success: true,
      data: tenant as Tenant,
    }
  } catch (error) {
    console.error('updateOrganization error:', error)
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError
      return { success: false, error: zodError.issues[0]?.message ?? 'Datos inválidos' }
    }
    if (error instanceof Error) {
      if (error.message === 'No autenticado') {
        return { success: false, error: 'No autenticado' }
      }
      if (error.message === 'Permisos insuficientes') {
        return { success: false, error: 'Solo administradores pueden realizar esta acción' }
      }
    }
    return { success: false, error: 'Error inesperado' }
  }
}

/**
 * Updates the organization's working hours configuration.
 * Admin-only operation.
 * Working hours are stored as JSONB with day keys and [start, end] time arrays.
 *
 * @param workingHours - Full working hours configuration object
 * @returns ActionResult with updated tenant data
 */
export async function updateWorkingHours(
  workingHours: WorkingHours
): Promise<ActionResult<Tenant>> {
  try {
    const validated = updateWorkingHoursSchema.parse(workingHours)
    const { supabase, tenantId, role } = await getCurrentUserContext()

    requireAdmin(role)

    const { data: tenant, error } = await supabase
      .from('tenants')
      .update({
        working_hours: validated,
        updated_at: new Date().toISOString(),
      })
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) {
      console.error('updateWorkingHours error:', error)
      return { success: false, error: 'Error al actualizar horarios de trabajo' }
    }

    revalidatePath('/settings')

    return {
      success: true,
      data: tenant as Tenant,
    }
  } catch (error) {
    console.error('updateWorkingHours error:', error)
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError
      return { success: false, error: zodError.issues[0]?.message ?? 'Horarios inválidos' }
    }
    if (error instanceof Error) {
      if (error.message === 'No autenticado') {
        return { success: false, error: 'No autenticado' }
      }
      if (error.message === 'Permisos insuficientes') {
        return { success: false, error: 'Solo administradores pueden realizar esta acción' }
      }
    }
    return { success: false, error: 'Error inesperado' }
  }
}

/**
 * Updates the default appointment duration in minutes.
 * Admin-only operation.
 *
 * @param minutes - Default appointment duration in minutes (5-480)
 * @returns ActionResult with updated tenant data
 */
export async function updateAppointmentDuration(
  minutes: number
): Promise<ActionResult<Tenant>> {
  try {
    const validated = updateAppointmentDurationSchema.parse({ minutes })
    const { supabase, tenantId, role } = await getCurrentUserContext()

    requireAdmin(role)

    const { data: tenant, error } = await supabase
      .from('tenants')
      .update({
        appointment_duration_minutes: validated.minutes,
        updated_at: new Date().toISOString(),
      })
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) {
      console.error('updateAppointmentDuration error:', error)
      return { success: false, error: 'Error al actualizar duración de citas' }
    }

    revalidatePath('/settings')

    return {
      success: true,
      data: tenant as Tenant,
    }
  } catch (error) {
    console.error('updateAppointmentDuration error:', error)
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError
      return { success: false, error: zodError.issues[0]?.message ?? 'Duración inválida' }
    }
    if (error instanceof Error) {
      if (error.message === 'No autenticado') {
        return { success: false, error: 'No autenticado' }
      }
      if (error.message === 'Permisos insuficientes') {
        return { success: false, error: 'Solo administradores pueden realizar esta acción' }
      }
    }
    return { success: false, error: 'Error inesperado' }
  }
}

/**
 * Updates the custom field definitions for medical records.
 * Admin-only operation.
 * Extra fields are stored as JSONB array with field configuration objects.
 *
 * @param extraFields - Array of custom field definitions
 * @returns ActionResult with updated tenant data
 */
export async function updateExtraFields(
  extraFields: CustomField[]
): Promise<ActionResult<Tenant>> {
  try {
    const validated = updateExtraFieldsSchema.parse({ extraFields })
    const { supabase, tenantId, role } = await getCurrentUserContext()

    requireAdmin(role)

    const { data: tenant, error } = await supabase
      .from('tenants')
      .update({
        extra_fields: validated.extraFields,
        updated_at: new Date().toISOString(),
      })
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) {
      console.error('updateExtraFields error:', error)
      return { success: false, error: 'Error al actualizar campos personalizados' }
    }

    revalidatePath('/settings')

    return {
      success: true,
      data: tenant as Tenant,
    }
  } catch (error) {
    console.error('updateExtraFields error:', error)
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError
      return { success: false, error: zodError.issues[0]?.message ?? 'Campos inválidos' }
    }
    if (error instanceof Error) {
      if (error.message === 'No autenticado') {
        return { success: false, error: 'No autenticado' }
      }
      if (error.message === 'Permisos insuficientes') {
        return { success: false, error: 'Solo administradores pueden realizar esta acción' }
      }
    }
    return { success: false, error: 'Error inesperado' }
  }
}

// =============================================================================
// User Profile Actions
// =============================================================================

/**
 * Updates the current user's profile settings.
 * Users can update their own display name.
 *
 * @param input - User profile fields to update
 * @returns ActionResult with updated user data
 */
export async function updateUserProfile(
  input: { displayName?: string }
): Promise<ActionResult<User>> {
  try {
    const validated = updateUserProfileSchema.parse(input)
    const { supabase, tenantId, userId } = await getCurrentUserContext()

    // Only update if there are changes
    if (!validated.displayName) {
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .eq('tenant_id', tenantId)
        .single()

      if (fetchError || !user) {
        return { success: false, error: 'Usuario no encontrado' }
      }

      return { success: true, data: user as User }
    }

    const { data: user, error } = await supabase
      .from('users')
      .update({
        display_name: validated.displayName,
      })
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) {
      console.error('updateUserProfile error:', error)
      return { success: false, error: 'Error al actualizar perfil' }
    }

    revalidatePath('/settings')

    return {
      success: true,
      data: user as User,
    }
  } catch (error) {
    console.error('updateUserProfile error:', error)
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError
      return { success: false, error: zodError.issues[0]?.message ?? 'Datos inválidos' }
    }
    if (error instanceof Error && error.message === 'No autenticado') {
      return { success: false, error: 'No autenticado' }
    }
    return { success: false, error: 'Error inesperado' }
  }
}

/**
 * Updates a provider's calendar color.
 * Admin-only operation for changing other users' colors.
 * Users can update their own color without admin rights.
 *
 * @param input - User ID and new color in hex format
 * @returns ActionResult with updated user data
 */
export async function updateProviderColor(
  input: { userId: string; color: string }
): Promise<ActionResult<User>> {
  try {
    const validated = updateProviderColorSchema.parse(input)
    const { supabase, tenantId, userId, role } = await getCurrentUserContext()

    // Users can only update their own color unless they're admin
    if (validated.userId !== userId) {
      requireAdmin(role)
    }

    const { data: user, error } = await supabase
      .from('users')
      .update({ color: validated.color })
      .eq('id', validated.userId)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) {
      console.error('updateProviderColor error:', error)
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Usuario no encontrado' }
      }
      return { success: false, error: 'Error al actualizar color' }
    }

    revalidatePath('/settings')

    return {
      success: true,
      data: user as User,
    }
  } catch (error) {
    console.error('updateProviderColor error:', error)
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError
      return { success: false, error: zodError.issues[0]?.message ?? 'Datos inválidos' }
    }
    if (error instanceof Error) {
      if (error.message === 'No autenticado') {
        return { success: false, error: 'No autenticado' }
      }
      if (error.message === 'Permisos insuficientes') {
        return { success: false, error: 'Solo administradores pueden cambiar colores de otros usuarios' }
      }
    }
    return { success: false, error: 'Error inesperado' }
  }
}

// =============================================================================
// Onboarding Actions
// =============================================================================

/**
 * Resets all onboarding flags to false.
 * Allows users to restart the onboarding tutorial.
 *
 * @returns ActionResult with updated tenant data
 */
export async function resetOnboarding(): Promise<ActionResult<Tenant>> {
  try {
    const { supabase, tenantId } = await getCurrentUserContext()

    const { data: tenant, error } = await supabase
      .from('tenants')
      .update({
        onboarding_create_patient: false,
        onboarding_create_appointment: false,
        onboarding_view_appointment: false,
        onboarding_complete_appointment: false,
        onboarding_visit_settings: false,
        updated_at: new Date().toISOString(),
      })
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) {
      console.error('resetOnboarding error:', error)
      return { success: false, error: 'Error al reiniciar tutorial' }
    }

    revalidatePath('/settings')
    revalidatePath('/dashboard')

    return {
      success: true,
      data: tenant as Tenant,
    }
  } catch (error) {
    console.error('resetOnboarding error:', error)
    if (error instanceof Error && error.message === 'No autenticado') {
      return { success: false, error: 'No autenticado' }
    }
    return { success: false, error: 'Error inesperado' }
  }
}

/**
 * Marks a specific onboarding step as complete.
 * Sets the corresponding onboarding flag to true.
 *
 * @param stepName - The onboarding step to mark complete
 * @returns ActionResult with updated tenant data
 */
export async function completeOnboardingStep(
  stepName: 'create_patient' | 'create_appointment' | 'view_appointment' | 'complete_appointment' | 'visit_settings'
): Promise<ActionResult<Tenant>> {
  try {
    const validated = onboardingStepSchema.parse(stepName)
    const { supabase, tenantId } = await getCurrentUserContext()

    // Map step name to database column
    const columnName = `onboarding_${validated}` as const

    const { data: tenant, error } = await supabase
      .from('tenants')
      .update({
        [columnName]: true,
        updated_at: new Date().toISOString(),
      })
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) {
      console.error('completeOnboardingStep error:', error)
      return { success: false, error: 'Error al completar paso del tutorial' }
    }

    revalidatePath('/dashboard')

    return {
      success: true,
      data: tenant as Tenant,
    }
  } catch (error) {
    console.error('completeOnboardingStep error:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Paso de onboarding inválido' }
    }
    if (error instanceof Error && error.message === 'No autenticado') {
      return { success: false, error: 'No autenticado' }
    }
    return { success: false, error: 'Error inesperado' }
  }
}
