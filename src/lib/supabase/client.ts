/**
 * Supabase Browser Client
 *
 * Creates a Supabase client for use in client components (browser).
 * Uses the public anon key and relies on RLS for security.
 *
 * Usage:
 *   const supabase = createClient()
 *   const { data } = await supabase.from('patients').select()
 *
 * Created: 2026-02-10 - Initial setup for MidiMed v2
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

/**
 * Creates a Supabase client for browser/client component use.
 * This client uses the public anon key and authenticates via session cookies.
 *
 * @returns Typed Supabase client instance
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
