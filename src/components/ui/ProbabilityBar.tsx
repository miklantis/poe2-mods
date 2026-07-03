import type { Slot } from '@/data/schema.coe'
import { cn } from '@/lib/utils'

const FILL: Record<Slot, string> = {
  prefix: 'bg-prefix',
  suffix: 'bg-suffix',
}

/**
 * Horizontaler Balken, dessen Breite relativ zum groessten Wert im Slot skaliert
 * (damit der wahrscheinlichste Eintrag den Balken fuellt). Der Zahlenwert wird
 * daneben separat angezeigt.
 */
export function ProbabilityBar({
  value,
  max,
  slot,
}: {
  value: number
  max: number
  slot: Slot
}) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 0
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-raised">
      <div
        className={cn('h-full rounded-full', FILL[slot])}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
