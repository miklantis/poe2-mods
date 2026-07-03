import { useMemo } from 'react'
import type { ModGroup } from '@/lib/query/engine'
import type { Slot } from '@/data/schema'
import type { ModView } from '@/components/ViewSwitcher'
import { ModGroupBlock } from '@/components/ModGroupBlock'
import { ModTable } from '@/components/ModTable'
import { cn } from '@/lib/utils'

const TITLE: Record<Slot, string> = { prefix: 'Präfixe', suffix: 'Suffixe' }
const DOT: Record<Slot, string> = { prefix: 'bg-prefix', suffix: 'bg-suffix' }
const TITLE_TEXT: Record<Slot, string> = {
  prefix: 'text-prefix',
  suffix: 'text-suffix',
}

function groupKey(g: ModGroup): string {
  return `${g.slot}-${g.group}`
}

/** Eine Slot-Spalte mit Kopfzeile und der gewaehlten Darstellung. */
export function ModColumn({
  slot,
  groups,
  view,
  collapsedKeys,
  onToggle,
}: {
  slot: Slot
  groups: readonly ModGroup[]
  view: ModView
  collapsedKeys: ReadonlySet<string>
  onToggle: (key: string) => void
}) {
  // Groesste Tier-Chance im Slot fuer die Balken-Skalierung.
  const maxTierProbability = useMemo(() => {
    let max = 0
    for (const g of groups)
      for (const m of g.mods) if (m.probability > max) max = m.probability
    return max
  }, [groups])

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className={cn('size-2 rounded-full', DOT[slot])} aria-hidden />
        <h2 className={cn('font-display text-[15px] font-bold', TITLE_TEXT[slot])}>
          {TITLE[slot]}
        </h2>
        <span className="font-mono text-[12px] tabular-nums text-muted-text">
          {groups.length}
        </span>
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-secondary-text">
          Keine Modifier in diesem Slot.
        </p>
      ) : view === 'table' ? (
        <ModTable
          slot={slot}
          groups={groups}
          isCollapsed={(k) => collapsedKeys.has(k)}
          onToggle={onToggle}
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {groups.map((g) => (
            <ModGroupBlock
              key={groupKey(g)}
              group={g}
              view={view === 'bars' ? 'bars' : 'cards'}
              collapsed={collapsedKeys.has(groupKey(g))}
              onToggle={() => onToggle(groupKey(g))}
              slotMaxTierProbability={maxTierProbability}
            />
          ))}
        </div>
      )}
    </div>
  )
}
