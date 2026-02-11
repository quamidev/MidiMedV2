/**
 * Supabase Admin Client
 *
 * Creates a Supabase client with service role privileges for admin operations.
 * This client bypasses RLS and should only be used for trusted server-side operations
 * that require elevated permissions (webhooks, cron jobs, admin tasks).
 *
 * IMPORTANT: Never expose this client to the browser or use in client components.
 *
 * Usage:
 *   import { supabaseAdmin } from '@/lib/supabase/admin'
 *   const { data } = await supabaseAdmin.from('tenants').select()
 *
 * Created: 2026-02-10 - Initial setup for MidiMed v2
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Supabase admin client with service role privileges.
 * Bypasses Row Level Security - use with caution.
 *
 * Use cases:
 * - Webhook handlers that need to update data without user context
 * - Cron jobs and scheduled tasks
 * - Admin operations that span multiple tenants
 * - Creating/managing auth users
 */
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
