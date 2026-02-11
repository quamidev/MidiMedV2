/**
 * Supabase Database Type Definitions
 *
 * This file contains the TypeScript types for the Supabase database schema.
 * Currently a placeholder that will be replaced with auto-generated types
 * from the Supabase CLI once the database schema is defined.
 *
 * To generate types from your Supabase schema, run:
 *   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
 *
 * Or for local development:
 *   npx supabase gen types typescript --local > src/types/database.ts
 *
 * Created: 2026-02-10 - Initial placeholder setup for MidiMed v2
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any

/**
 * Helper type to extract row types from a table.
 * Usage: type Patient = Tables<'patients'>
 */
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

/**
 * Helper type to extract insert types from a table.
 * Usage: type PatientInsert = TablesInsert<'patients'>
 */
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

/**
 * Helper type to extract update types from a table.
 * Usage: type PatientUpdate = TablesUpdate<'patients'>
 */
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
