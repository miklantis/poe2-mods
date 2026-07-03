import type { ComputedMod } from '@/lib/query/engine'
import type { Slot } from '@/data/schema'
import { cleanModText } from '@/lib/modText'
import { formatPercent } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { ProbabilityBar } from '@/components/ui/ProbabilityBar'
import { cn } from '@/lib/utils'

const SLOT_BADGE: Record<Slot, string> = {
  prefix: 'border-prefix/40 bg-prefix/10 text-prefix',
  suffix: 'border-suffix/40 bg-suffix/10 text-suffix',
}
const SLOT_TEXT: Record<Slot, string> = {
  prefix: 'text-prefix',
  suffix: 'text-suffix',
}

/** Tier-Zeile im Balken-View: Text plus Chance-Balken relativ zum Slot-Max. */
export function TierBar({
  item,
  slot,
  max,
}: {
  item: ComputedMod
  slot: Slot
  max: number
}) {
  return (
    <div className="px-3 py-2">
      <div className="flex items-baseline gap-3">
        <Badge className={cn('shrink-0', SLOT_BADGE[slot])}>T{item.tier}</Badge>
        <span className="flex-1 truncate text-[13px] text-body">
          {cleanModText(item.mod.text)}
        </span>
        <span
          className={cn(
            'w-16 shrink-0 text-right font-mono text-[12px] tabular-nums',
            SLOT_TEXT[slot],
          )}
        >
          {formatPercent(item.probability)}
        </span>
      </div>
      <div className="mt-1.5 pl-[3rem]">
        <ProbabilityBar value={item.probability} max={max} slot={slot} />
      </div>
    </div>
  )
}
