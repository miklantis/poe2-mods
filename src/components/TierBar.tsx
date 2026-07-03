import type { ComputedMod } from '@/lib/query/baseEngine'
import { fillModText } from '@/lib/modText'
import { formatPercent } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { ProbabilityBar } from '@/components/ui/ProbabilityBar'
import type { Accent } from '@/components/ui/accent'
import { ACCENT_BADGE, ACCENT_TEXT } from '@/components/ui/accent'
import { cn } from '@/lib/utils'

/**
 * Tier-Zeile im Balken-View: Text plus Chance-Balken relativ zum Slot-Max. Ohne
 * `showProbability` (Corrupted/Desecrated) entfaellt der Balken; es bleibt der
 * Text mit Tier-Badge.
 */
export function TierBar({
  item,
  accent,
  max,
  showProbability,
}: {
  item: ComputedMod
  accent: Accent
  max: number
  showProbability: boolean
}) {
  return (
    <div className="px-3 py-2">
      <div className="flex items-baseline gap-3">
        <Badge className={cn('shrink-0', ACCENT_BADGE[accent])}>T{item.tier}</Badge>
        <span className="flex-1 truncate text-[13px] text-body">
          {fillModText(item.mod.text, item.values)}
        </span>
        {showProbability && (
          <span
            className={cn(
              'w-16 shrink-0 text-right font-mono text-[12px] tabular-nums',
              ACCENT_TEXT[accent],
            )}
          >
            {formatPercent(item.probability)}
          </span>
        )}
      </div>
      {showProbability && (
        <div className="mt-1.5 pl-[3rem]">
          <ProbabilityBar value={item.probability} max={max} accent={accent} />
        </div>
      )}
    </div>
  )
}
