/**
 * Skeleton component for loading states.
 * Provides a pulsing placeholder while content loads.
 *
 * Created: 2026-02-10 - MV2-016 Patient list page
 */

import { cn } from '@/lib/utils'

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  )
}

export { Skeleton }
