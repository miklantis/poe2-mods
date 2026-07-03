import type { Accent } from '@/components/ui/accent'
import { ACCENT_FILL } from '@/components/ui/accent'
import { cn } from '@/lib/utils'

/**
 * Horizontaler Balken, dessen Breite relativ zum groessten Wert im Slot skaliert
 * (damit der wahrscheinlichste Eintrag den Balken fuellt). Der Zahlenwert wird
 * daneben separat angezeigt.
 */
export function ProbabilityBar({
  value,
  max,
  accent,
}: {
  value: number
  max: number
  accent: Accent
}) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 0
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-raised">
      <div
        className={cn('h-full rounded-full', ACCENT_FILL[accent])}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
