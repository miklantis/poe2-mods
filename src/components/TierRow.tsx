import type { ReactNode } from 'react'
import type { ComputedMod } from '@/lib/query/baseEngine'
import { fillModText } from '@/lib/modText'
import { formatPercent, formatWeight } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import type { Accent } from '@/components/ui/accent'
import { ACCENT_BADGE, ACCENT_TEXT } from '@/components/ui/accent'
import { cn } from '@/lib/utils'

const RANGE_SPLIT = /(\([\d.]+-[\d.]+\)|\([\d.]+\))/g

/** Zerlegt den Text und hebt die Rollen-Bereiche `(min-max)` mono hervor. */
function renderText(text: string): ReactNode[] {
  return text.split(RANGE_SPLIT).map((part, i) =>
    RANGE_SPLIT.test(part) ? (
      <span key={i} className="font-mono text-heading tabular-nums">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  )
}

/**
 * Tier-Zeile im Karten-View. `showProbability` blendet die Chance aus – bei
 * Herkuenften ohne sinnvolle Spawn-Wahrscheinlichkeit (Corrupted, Desecrated).
 */
export function TierRow({
  item,
  accent,
  showProbability,
}: {
  item: ComputedMod
  accent: Accent
  showProbability: boolean
}) {
  return (
    <div className="px-3 py-2">
      <div className="flex items-baseline gap-3">
        <Badge className={cn('shrink-0', ACCENT_BADGE[accent])}>
          T{item.tier}
        </Badge>
        <span className="flex-1 text-[13.5px] leading-snug text-body">
          {renderText(fillModText(item.mod.text, item.values))}
        </span>
        {showProbability && (
          <span
            className={cn(
              'w-16 shrink-0 text-right font-mono text-[12.5px] tabular-nums',
              ACCENT_TEXT[accent],
            )}
          >
            {formatPercent(item.probability)}
          </span>
        )}
      </div>
      <div className="mt-1 flex gap-4 pl-[3rem] font-mono text-[11px] tabular-nums text-muted-text">
        <span>Stufe {item.ilvl}</span>
        {showProbability && <span>Gewicht {formatWeight(item.weight)}</span>}
      </div>
    </div>
  )
}
