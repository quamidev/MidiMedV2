/**
 * Patient Search Component
 *
 * Search input with debounce (300ms) for filtering patients.
 * Features a clean, clinical design with smooth animations.
 *
 * Created: 2026-02-10 - MV2-016 Patient list page
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

interface PatientSearchProps {
  onSearch: (term: string) => void
  initialValue?: string
  placeholder?: string
  className?: string
}

export function PatientSearch({
  onSearch,
  initialValue = '',
  placeholder = 'Buscar por nombre, correo o telefono...',
  className,
}: PatientSearchProps) {
  const [value, setValue] = useState(initialValue)
  const [isFocused, setIsFocused] = useState(false)

  // Debounced search callback
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(value)
    }, 300)

    return () => clearTimeout(timer)
  }, [value, onSearch])

  const handleClear = useCallback(() => {
    setValue('')
    onSearch('')
  }, [onSearch])

  return (
    <div className={cn('relative w-full max-w-md', className)}>
      {/* Search icon with animation */}
      <motion.div
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10"
        animate={{
          color: isFocused ? 'var(--primary)' : 'var(--muted-foreground)',
          scale: isFocused ? 1.05 : 1,
        }}
        transition={{ duration: 0.2 }}
      >
        <Search className="h-4 w-4" />
      </motion.div>

      {/* Input field */}
      <Input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className={cn(
          'pl-10 pr-10 h-11',
          'bg-background/80 backdrop-blur-sm',
          'border-border/60 hover:border-border',
          'focus-visible:ring-primary/20 focus-visible:ring-4 focus-visible:border-primary/50',
          'transition-all duration-200',
          'placeholder:text-muted-foreground/60'
        )}
      />

      {/* Clear button */}
      <AnimatePresence>
        {value && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            onClick={handleClear}
            className={cn(
              'absolute right-3 top-1/2 -translate-y-1/2',
              'p-1 rounded-full',
              'text-muted-foreground hover:text-foreground',
              'hover:bg-muted/80',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1'
            )}
            type="button"
            aria-label="Limpiar busqueda"
          >
            <X className="h-3.5 w-3.5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Focus ring glow effect */}
      <motion.div
        className="absolute inset-0 rounded-lg pointer-events-none"
        animate={{
          boxShadow: isFocused
            ? '0 0 0 3px oklch(62% 0.12 195 / 0.1)'
            : '0 0 0 0px oklch(62% 0.12 195 / 0)',
        }}
        transition={{ duration: 0.2 }}
      />
    </div>
  )
}
