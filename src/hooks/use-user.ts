/**
 * Re-export of useUser hook from user-context
 *
 * This file provides a convenient import path for the useUser hook.
 * Components can import from '@/hooks/use-user' instead of '@/contexts/user-context'.
 *
 * Created: 2026-02-10 - Initial implementation for MidiMed v2 (MV2-008)
 */

export { useUser } from '@/contexts/user-context'
export type { User, Tenant } from '@/contexts/user-context'
