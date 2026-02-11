/**
 * Color Picker Component
 *
 * Simple color picker using native HTML color input with
 * a styled preview circle. Used for provider calendar colors.
 *
 * Created: 2026-02-10 - MV2-042 Team Management UI
 */

'use client'

import { useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'

// =============================================================================
// Types
// =============================================================================

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
  disabled?: boolean
  size?: 'sm' | 'md'
}

// =============================================================================
// Component
// =============================================================================

export function ColorPicker({
  color,
  onChange,
  disabled = false,
  size = 'md',
}: ColorPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClick = useCallback(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.click()
    }
  }, [disabled])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value)
    },
    [onChange]
  )

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          'rounded-full border-2 border-border transition-all duration-200',
          'hover:border-primary hover:scale-110',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
          size === 'sm' ? 'h-6 w-6' : 'h-8 w-8'
        )}
        style={{ backgroundColor: color }}
        title="Cambiar color"
      />
      <input
        ref={inputRef}
        type="color"
        value={color}
        onChange={handleChange}
        disabled={disabled}
        className="sr-only"
      />
    </div>
  )
}
