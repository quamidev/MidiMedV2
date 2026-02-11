/**
 * User Context Provider
 *
 * Provides auth state and user/tenant data to all client components.
 * Subscribes to Supabase auth state changes and loads related data.
 *
 * Created: 2026-02-10 - Initial implementation for MidiMed v2 (MV2-008)
 */

'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { User as SupabaseUser } from '@supabase/supabase-js'

import { createClient } from '@/lib/supabase/client'
import type { CustomField } from '@/types/app'

/**
 * User data from the users table
 */
export interface User {
  id: string
  auth_id: string
  tenant_id: string
  email: string
  display_name: string
  role: 'admin' | 'provider' | 'staff'
  color: string | null
  avatar_url: string | null
  invited_by: string | null
  created_at: string
  last_login_at: string
}

/**
 * Tenant data from the tenants table
 */
export interface Tenant {
  id: string
  tenant_id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  logo_url: string | null
  specialties: string[]
  appointment_duration_minutes: number
  working_hours: Record<string, [string, string] | null>
  extra_fields: CustomField[]
  total_patients: number
  total_appointments: number
  total_records: number
  billing_plan: 'TRIAL' | 'BASIC' | 'PRO' | 'ENTERPRISE'
  billing_status: 'TRIAL_ACTIVE' | 'TRIAL_EXPIRED' | 'PAID_ACTIVE' | 'PAST_DUE'
  trial_start_at: string
  trial_days: number
  purchased_at: string | null
  paid_through: string | null
  provider_subscription_id: string | null
  wants_to_buy: string | null
  onboarding_create_patient: boolean
  onboarding_create_appointment: boolean
  onboarding_view_appointment: boolean
  onboarding_complete_appointment: boolean
  onboarding_visit_settings: boolean
  created_at: string
  updated_at: string
}

/**
 * User context value interface
 */
interface UserContextValue {
  /** The authenticated Supabase user (from auth) */
  authUser: SupabaseUser | null
  /** The user record from the users table */
  user: User | null
  /** The tenant record from the tenants table */
  tenant: Tenant | null
  /** Whether the initial auth check is still loading */
  loading: boolean
  /** Whether user/tenant data is being fetched after auth */
  dataLoading: boolean
  /** Refresh user and tenant data from the database */
  refreshUser: () => Promise<void>
  /** Sign out the current user */
  signOut: () => Promise<void>
}

const UserContext = createContext<UserContextValue | undefined>(undefined)

interface UserProviderProps {
  children: React.ReactNode
}

/**
 * UserProvider component
 *
 * Wraps the application to provide auth state and user/tenant data.
 * Subscribes to Supabase auth state changes and automatically loads
 * user and tenant data when the auth state changes.
 */
export function UserProvider({ children }: UserProviderProps) {
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(false)

  const supabase = useMemo(() => createClient(), [])

  /**
   * Fetches user and tenant data from the database
   */
  const loadUserData = useCallback(
    async (authId: string) => {
      setDataLoading(true)
      try {
        // Fetch user record by auth_id
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', authId)
          .single()

        if (userError || !userData) {
          console.error('Failed to fetch user data:', userError)
          setUser(null)
          setTenant(null)
          return
        }

        setUser(userData as User)

        // Fetch tenant record by tenant_id
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select('*')
          .eq('tenant_id', userData.tenant_id)
          .single()

        if (tenantError || !tenantData) {
          console.error('Failed to fetch tenant data:', tenantError)
          setTenant(null)
          return
        }

        setTenant(tenantData as Tenant)
      } catch (error) {
        console.error('Error loading user data:', error)
        setUser(null)
        setTenant(null)
      } finally {
        setDataLoading(false)
      }
    },
    [supabase]
  )

  /**
   * Refreshes user and tenant data from the database
   */
  const refreshUser = useCallback(async () => {
    if (!authUser?.id) return
    await loadUserData(authUser.id)
  }, [authUser?.id, loadUserData])

  /**
   * Signs out the current user
   */
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      setAuthUser(null)
      setUser(null)
      setTenant(null)
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }, [supabase.auth])

  // Subscribe to auth state changes
  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          setAuthUser(session.user)
          await loadUserData(session.user.id)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setAuthUser(session.user)
        await loadUserData(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        setAuthUser(null)
        setUser(null)
        setTenant(null)
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        setAuthUser(session.user)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth, loadUserData])

  const value = useMemo<UserContextValue>(
    () => ({
      authUser,
      user,
      tenant,
      loading,
      dataLoading,
      refreshUser,
      signOut,
    }),
    [authUser, user, tenant, loading, dataLoading, refreshUser, signOut]
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

/**
 * Hook to access user context
 *
 * @returns User context value including user, tenant, loading states, and actions
 * @throws Error if used outside of UserProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, tenant, loading, refreshUser } = useUser()
 *
 *   if (loading) return <LoadingSpinner />
 *   if (!user) return <Redirect to="/login" />
 *
 *   return <div>Bienvenido, {user.display_name}</div>
 * }
 * ```
 */
export function useUser(): UserContextValue {
  const context = useContext(UserContext)

  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }

  return context
}
