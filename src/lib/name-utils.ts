/**
 * Name utility functions for parsing display names.
 *
 * Created: 2026-02-10 - Extract getFirstName to skip title prefixes
 */

const TITLE_PREFIXES = new Set(['dr.', 'dra.', 'lic.', 'ing.', 'sr.', 'sra.'])

/**
 * Extracts the actual first name from a display name, skipping common
 * Spanish title prefixes (Dr., Dra., Lic., Ing., Sr., Sra.).
 *
 * Examples:
 *   "Dr. Andres Quezada"  -> "Andres"
 *   "Andres Quezada"      -> "Andres"
 *   "Dra. Maria Lopez"    -> "Maria"
 */
export function getFirstName(displayName: string): string {
  const parts = displayName.trim().split(/\s+/)
  for (const part of parts) {
    if (!TITLE_PREFIXES.has(part.toLowerCase())) {
      return part
    }
  }
  return parts[0] ?? displayName
}
