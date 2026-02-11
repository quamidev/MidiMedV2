'use server'

/**
 * Authentication Server Actions
 *
 * Handles all authentication flows: signup, login, magic link, and invitations.
 * Uses Supabase Auth for authentication and manages tenant/user records.
 *
 * Created: 2026-02-10 - MV2-007 Authentication server actions
 */

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { z } from 'zod'

import { createServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type {
  ActionResult,
  SignUpInput,
  SignUpResult,
  SignInInput,
  SignInResult,
  SendMagicLinkInput,
  AcceptInvitationInput,
  AcceptInvitationResult,
  User,
  Tenant,
  WorkingHours,
} from '@/types/app'

// =============================================================================
// Validation Schemas
// =============================================================================

const signUpSchema = z.object({
  email: z.string().email('Correo electronico invalido'),
  password: z.string().min(8, 'La contrasena debe tener al menos 8 caracteres'),
  displayName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  clinicName: z.string().min(2, 'El nombre de la clinica debe tener al menos 2 caracteres'),
  phone: z.string().optional(),
  address: z.string().optional(),
  specialties: z.array(z.string()).optional(),
})

const signInSchema = z.object({
  email: z.string().email('Correo electronico invalido'),
  password: z.string().min(1, 'La contrasena es requerida'),
})

const sendMagicLinkSchema = z.object({
  email: z.string().email('Correo electronico invalido'),
})

const acceptInvitationSchema = z.object({
  email: z.string().email('Correo electronico invalido'),
  tempPassword: z.string().min(1, 'La contrasena temporal es requerida'),
  newPassword: z.string().min(8, 'La nueva contrasena debe tener al menos 8 caracteres'),
  displayName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
})

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Generates a URL-safe slug from a clinic name.
 * Example: "Clinica Gonzalez" -> "clinica-gonzalez"
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove consecutive hyphens
    .trim()
}

/**
 * Generates a random 5-digit suffix for tenant IDs.
 * Example: "12345"
 */
function generateRandomSuffix(): string {
  return Math.floor(10000 + Math.random() * 90000).toString()
}

/**
 * Generates a unique tenant ID from a clinic name.
 * Format: {slug}-{5-digit-suffix}
 * Example: "clinica-gonzalez-12345"
 */
function generateTenantId(clinicName: string): string {
  const slug = generateSlug(clinicName)
  const suffix = generateRandomSuffix()
  return `${slug}-${suffix}`
}

/**
 * Default working hours configuration for new tenants.
 * Monday-Friday: 08:00-17:00
 * Saturday: 08:00-12:00
 * Sunday: Closed
 */
function getDefaultWorkingHours(): WorkingHours {
  return {
    mon: ['08:00', '17:00'],
    tue: ['08:00', '17:00'],
    wed: ['08:00', '17:00'],
    thu: ['08:00', '17:00'],
    fri: ['08:00', '17:00'],
    sat: ['08:00', '12:00'],
    sun: null,
  }
}

// =============================================================================
// Server Actions
// =============================================================================

/**
 * Signs up a new user and creates their tenant/organization.
 *
 * Flow:
 * 1. Validate input
 * 2. Create Supabase Auth user
 * 3. Create tenant record with default settings
 * 4. Create user record linked to auth and tenant
 *
 * @param input - Signup form data
 * @returns ActionResult with user and tenant data, or error
 */
export async function signUp(input: SignUpInput): Promise<ActionResult<SignUpResult>> {
  try {
    // Validate input
    const validated = signUpSchema.parse(input)

    // Generate tenant ID from clinic name
    const tenantId = generateTenantId(validated.clinicName)
    const now = new Date().toISOString()

    // Step 1: Create Supabase Auth user using admin client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: validated.email,
      password: validated.password,
      email_confirm: true, // Skip email verification for now (can be changed)
      user_metadata: {
        display_name: validated.displayName,
        tenant_id: tenantId,
      },
    })

    if (authError || !authData.user) {
      console.error('Auth creation error:', authError)
      if (authError?.message?.includes('already registered')) {
        return { success: false, error: 'Este correo ya esta registrado' }
      }
      return { success: false, error: 'Error al crear la cuenta. Intenta de nuevo.' }
    }

    const authUser = authData.user

    // Step 2: Create tenant record with defaults
    const tenantData = {
      tenant_id: tenantId,
      name: validated.clinicName,
      email: validated.email,
      phone: validated.phone || null,
      address: validated.address || null,
      logo_url: null,
      specialties: validated.specialties || [],

      // Settings - defaults
      appointment_duration_minutes: 30,
      working_hours: getDefaultWorkingHours(),
      extra_fields: [],

      // Counters - start at 0
      total_patients: 0,
      total_appointments: 0,
      total_records: 0,

      // Billing - trial plan
      billing_plan: 'TRIAL' as const,
      billing_status: 'TRIAL_ACTIVE' as const,
      trial_start_at: now,
      trial_days: 30,
      purchased_at: null,
      paid_through: null,
      provider_subscription_id: null,
      wants_to_buy: null,

      // Onboarding - all false
      onboarding_create_patient: false,
      onboarding_create_appointment: false,
      onboarding_view_appointment: false,
      onboarding_complete_appointment: false,
      onboarding_visit_settings: false,

      created_at: now,
      updated_at: now,
    }

    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert(tenantData)
      .select()
      .single()

    if (tenantError || !tenant) {
      console.error('Tenant creation error:', tenantError)
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(authUser.id)
      return { success: false, error: 'Error al crear la organizacion. Intenta de nuevo.' }
    }

    // Step 3: Create user record
    const userData = {
      auth_id: authUser.id,
      tenant_id: tenantId,
      email: validated.email,
      display_name: validated.displayName,
      role: 'admin' as const,
      color: '#3abdd4', // Default brand color
      avatar_url: null,
      invited_by: null,
      created_at: now,
      last_login_at: now,
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert(userData)
      .select()
      .single()

    if (userError || !user) {
      console.error('User creation error:', userError)
      // Rollback: delete tenant and auth user
      await supabaseAdmin.from('tenants').delete().eq('tenant_id', tenantId)
      await supabaseAdmin.auth.admin.deleteUser(authUser.id)
      return { success: false, error: 'Error al crear el usuario. Intenta de nuevo.' }
    }

    // Sign in the user after successful signup
    const supabase = await createServerClient()
    await supabase.auth.signInWithPassword({
      email: validated.email,
      password: validated.password,
    })

    revalidatePath('/', 'layout')

    return {
      success: true,
      data: {
        user: user as User,
        tenant: tenant as Tenant,
      },
    }
  } catch (error) {
    console.error('signUp error:', error)
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError
      return { success: false, error: zodError.issues[0]?.message ?? 'Datos invalidos' }
    }
    return { success: false, error: 'Error inesperado. Intenta de nuevo.' }
  }
}

/**
 * Signs in a user with email and password.
 *
 * @param input - Sign in credentials
 * @returns ActionResult with user and tenant data, or error
 */
export async function signInWithPassword(input: SignInInput): Promise<ActionResult<SignInResult>> {
  try {
    // Validate input
    const validated = signInSchema.parse(input)

    const supabase = await createServerClient()

    // Attempt sign in
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: validated.email,
      password: validated.password,
    })

    if (authError || !authData.user) {
      console.error('Sign in error:', authError)
      if (authError?.message?.includes('Invalid login credentials')) {
        return { success: false, error: 'Correo o contrasena incorrectos' }
      }
      return { success: false, error: 'Error al iniciar sesion. Intenta de nuevo.' }
    }

    // Fetch user record with tenant data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authData.user.id)
      .single()

    if (userError || !user) {
      console.error('User fetch error:', userError)
      return { success: false, error: 'Usuario no encontrado' }
    }

    // Fetch tenant record
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('tenant_id', user.tenant_id)
      .single()

    if (tenantError || !tenant) {
      console.error('Tenant fetch error:', tenantError)
      return { success: false, error: 'Organizacion no encontrada' }
    }

    // Update last login timestamp
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id)

    revalidatePath('/', 'layout')

    return {
      success: true,
      data: {
        user: user as User,
        tenant: tenant as Tenant,
      },
    }
  } catch (error) {
    console.error('signInWithPassword error:', error)
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError
      return { success: false, error: zodError.issues[0]?.message ?? 'Datos invalidos' }
    }
    return { success: false, error: 'Error inesperado. Intenta de nuevo.' }
  }
}

/**
 * Sends a magic link email for passwordless authentication.
 *
 * @param input - Email to send magic link to
 * @returns ActionResult indicating success or error
 */
export async function sendMagicLink(input: SendMagicLinkInput): Promise<ActionResult<void>> {
  try {
    // Validate input
    const validated = sendMagicLinkSchema.parse(input)

    const supabase = await createServerClient()

    // Check if user exists
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', validated.email)
      .single()

    if (!user) {
      // Don't reveal if email exists or not for security
      return {
        success: true,
        data: undefined,
      }
    }

    // Get the base URL for redirect
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const redirectTo = `${baseUrl}/finish-sign-in`

    // Send magic link
    const { error } = await supabase.auth.signInWithOtp({
      email: validated.email,
      options: {
        emailRedirectTo: redirectTo,
      },
    })

    if (error) {
      console.error('Magic link error:', error)
      return { success: false, error: 'Error al enviar el enlace. Intenta de nuevo.' }
    }

    return {
      success: true,
      data: undefined,
    }
  } catch (error) {
    console.error('sendMagicLink error:', error)
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError
      return { success: false, error: zodError.issues[0]?.message ?? 'Datos invalidos' }
    }
    return { success: false, error: 'Error inesperado. Intenta de nuevo.' }
  }
}

/**
 * Signs out the current user and clears session cookies.
 *
 * @returns ActionResult indicating success or error
 */
export async function signOut(): Promise<ActionResult<void>> {
  try {
    const supabase = await createServerClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Sign out error:', error)
      return { success: false, error: 'Error al cerrar sesion. Intenta de nuevo.' }
    }

    // Clear all Supabase auth cookies
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()

    for (const cookie of allCookies) {
      if (cookie.name.includes('sb-') || cookie.name.includes('supabase')) {
        cookieStore.delete(cookie.name)
      }
    }

    revalidatePath('/', 'layout')

    return {
      success: true,
      data: undefined,
    }
  } catch (error) {
    console.error('signOut error:', error)
    return { success: false, error: 'Error inesperado. Intenta de nuevo.' }
  }
}

/**
 * Accepts a team invitation and creates a new user account.
 *
 * Flow:
 * 1. Find the invitation by email
 * 2. Validate the temporary password
 * 3. Create Supabase Auth user with new password
 * 4. Create user record linked to the tenant
 * 5. Mark invitation as accepted
 *
 * @param input - Invitation acceptance data
 * @returns ActionResult with user and tenant data, or error
 */
export async function acceptInvitation(
  input: AcceptInvitationInput
): Promise<ActionResult<AcceptInvitationResult>> {
  try {
    // Validate input
    const validated = acceptInvitationSchema.parse(input)

    // Step 1: Find the invitation
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('invites')
      .select('*')
      .eq('email', validated.email)
      .eq('status', 'pending')
      .single()

    if (inviteError || !invite) {
      console.error('Invite fetch error:', inviteError)
      return { success: false, error: 'Invitacion no encontrada o ya fue usada' }
    }

    // Check if invitation has expired
    if (new Date(invite.expires_at) < new Date()) {
      // Mark as expired
      await supabaseAdmin
        .from('invites')
        .update({ status: 'expired' })
        .eq('id', invite.id)
      return { success: false, error: 'La invitacion ha expirado' }
    }

    // Step 2: Validate temporary password
    if (invite.temp_password !== validated.tempPassword) {
      return { success: false, error: 'Contrasena temporal incorrecta' }
    }

    const now = new Date().toISOString()

    // Step 3: Create Supabase Auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: validated.email,
      password: validated.newPassword,
      email_confirm: true,
      user_metadata: {
        display_name: validated.displayName || invite.display_name,
        tenant_id: invite.tenant_id,
      },
    })

    if (authError || !authData.user) {
      console.error('Auth creation error:', authError)
      if (authError?.message?.includes('already registered')) {
        return { success: false, error: 'Este correo ya esta registrado' }
      }
      return { success: false, error: 'Error al crear la cuenta. Intenta de nuevo.' }
    }

    const authUser = authData.user

    // Step 4: Create user record
    const userData = {
      auth_id: authUser.id,
      tenant_id: invite.tenant_id,
      email: validated.email,
      display_name: validated.displayName || invite.display_name,
      role: invite.role,
      color: '#3abdd4', // Default brand color
      avatar_url: null,
      invited_by: invite.invited_by,
      created_at: now,
      last_login_at: now,
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert(userData)
      .select()
      .single()

    if (userError || !user) {
      console.error('User creation error:', userError)
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(authUser.id)
      return { success: false, error: 'Error al crear el usuario. Intenta de nuevo.' }
    }

    // Step 5: Mark invitation as accepted
    await supabaseAdmin
      .from('invites')
      .update({ status: 'accepted' })
      .eq('id', invite.id)

    // Fetch tenant data
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('*')
      .eq('tenant_id', invite.tenant_id)
      .single()

    if (tenantError || !tenant) {
      console.error('Tenant fetch error:', tenantError)
      return { success: false, error: 'Organizacion no encontrada' }
    }

    // Sign in the user
    const supabase = await createServerClient()
    await supabase.auth.signInWithPassword({
      email: validated.email,
      password: validated.newPassword,
    })

    revalidatePath('/', 'layout')

    return {
      success: true,
      data: {
        user: user as User,
        tenant: tenant as Tenant,
      },
    }
  } catch (error) {
    console.error('acceptInvitation error:', error)
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError
      return { success: false, error: zodError.issues[0]?.message ?? 'Datos invalidos' }
    }
    return { success: false, error: 'Error inesperado. Intenta de nuevo.' }
  }
}

/**
 * Gets the current authenticated user and their tenant.
 * Useful for checking auth state in server components.
 *
 * @returns ActionResult with user and tenant data, or null if not authenticated
 */
export async function getCurrentUser(): Promise<ActionResult<SignInResult | null>> {
  try {
    const supabase = await createServerClient()

    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return { success: true, data: null }
    }

    // Fetch user record
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authUser.id)
      .single()

    if (userError || !user) {
      return { success: true, data: null }
    }

    // Fetch tenant record
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('tenant_id', user.tenant_id)
      .single()

    if (tenantError || !tenant) {
      return { success: true, data: null }
    }

    return {
      success: true,
      data: {
        user: user as User,
        tenant: tenant as Tenant,
      },
    }
  } catch (error) {
    console.error('getCurrentUser error:', error)
    return { success: false, error: 'Error al obtener el usuario' }
  }
}
