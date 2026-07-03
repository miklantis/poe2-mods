import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Schlichtes Badge-Primitive. Farbe/Variante wird per className gesteuert,
 * damit es fuer Tier-Badges (Praefix/Suffix) und Meta-Chips gleichermassen
 * passt.
 */
function Badge({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="badge"
      className={cn(
        'inline-flex items-center justify-center rounded-md border px-1.5 py-0.5 text-[11px] font-semibold leading-none tabular-nums',
        className,
      )}
      {...props}
    />
  )
}

export { Badge }
