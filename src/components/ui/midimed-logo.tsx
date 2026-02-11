/**
 * MidiMed Logo Component
 *
 * Renders the official MidiMed SVG logo with variant support
 * for different background contexts.
 *
 * Created: 2026-02-10 - Brand consistency update
 */

import Image from 'next/image'
import { cn } from '@/lib/utils'

const VARIANTS = {
  primary: '/logoPrimary.svg',
  white: '/logo.svg',
  dark: '/logoLightmode.svg',
} as const

interface MidimedLogoProps {
  variant?: keyof typeof VARIANTS
  size?: number
  className?: string
}

export function MidimedLogo({
  variant = 'primary',
  size = 36,
  className,
}: MidimedLogoProps) {
  return (
    <Image
      src={VARIANTS[variant]}
      alt="MidiMed"
      width={size}
      height={size}
      className={cn('shrink-0', className)}
      priority
    />
  )
}
