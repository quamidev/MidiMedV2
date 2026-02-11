/**
 * Utility functions for the application.
 * Contains the cn() helper for merging Tailwind CSS classes with conflict resolution.
 *
 * Created: 2026-02-10 - Initial setup for MidiMed v2
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges Tailwind CSS classes with conflict resolution.
 * Uses clsx for conditional class handling and tailwind-merge for deduplication.
 *
 * @example
 * cn("px-4 py-2", conditional && "bg-primary", className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
