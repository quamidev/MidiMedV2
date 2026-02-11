/**
 * Supabase Server Client
 *
 * Creates a Supabase client for use in Server Components, Server Actions,
 * and API routes. Handles cookie-based session management for SSR.
 *
 * Usage:
 *   const supabase = await createServerClient()
 *   const { data: { user } } = await supabase.auth.getUser()
 *
 * Created: 2026-02-10 - Initial setup for MidiMed v2
 */

import { createServerClient as createSSRServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

/**
 * Creates a Supabase client for server-side use (RSC, Server Actions, API routes).
 * Manages session via HTTP-only cookies using Next.js cookies() API.
 *
 * @returns Promise resolving to a typed Supabase client instance
 */
export async function createServerClient() {
  const cookieStore = await cookies()

  return createSSRServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method is called from a Server Component where
            // cookies cannot be set. This can be safely ignored if you have
            // middleware refreshing user sessions.
          }
        },
      },
    }
  )
}
