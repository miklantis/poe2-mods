import type { ReactNode } from 'react'
import type { ComputedMod } from '@/lib/query/baseEngine'
import type { Slot } from '@/data/schema.coe'
import { fillModText } from '@/lib/modText'
import { formatPercent, formatWeight } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
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

const SLOT_BADGE: Record<Slot, string> = {
  prefix: 'border-prefix/40 bg-prefix/10 text-prefix',
  suffix: 'border-suffix/40 bg-suffix/10 text-suffix',
}
const SLOT_TEXT: Record<Slot, string> = {
  prefix: 'text-prefix',
  suffix: 'text-suffix',
}

export function TierRow({ item, slot }: { item: ComputedMod; slot: Slot }) {
  return (
    <div className="px-3 py-2">
      <div className="flex items-baseline gap-3">
        <Badge className={cn('shrink-0', SLOT_BADGE[slot])}>
          T{item.tier}
        </Badge>
        <span className="flex-1 text-[13.5px] leading-snug text-body">
          {renderText(fillModText(item.mod.text, item.values))}
        </span>
        <span
          className={cn(
            'w-16 shrink-0 text-right font-mono text-[12.5px] tabular-nums',
            SLOT_TEXT[slot],
          )}
        >
          {formatPercent(item.probability)}
        </span>
      </div>
      <div className="mt-1 flex gap-4 pl-[3rem] font-mono text-[11px] tabular-nums text-muted-text">
        <span>Stufe {item.ilvl}</span>
        <span>Gewicht {formatWeight(item.weight)}</span>
      </div>
    </div>
  )
}
