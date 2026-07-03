import type { ModGroup } from '@/lib/query/engine'
import type { Slot } from '@/data/schema'
import { ModGroupBlock } from '@/components/ModGroupBlock'
import { cn } from '@/lib/utils'

const TITLE: Record<Slot, string> = {
  prefix: 'Präfixe',
  suffix: 'Suffixe',
}
const DOT: Record<Slot, string> = {
  prefix: 'bg-prefix',
  suffix: 'bg-suffix',
}
const TITLE_TEXT: Record<Slot, string> = {
  prefix: 'text-prefix',
  suffix: 'text-suffix',
}

/** Eine Slot-Spalte mit Kopfzeile (Titel + Gruppenanzahl) und Gruppen. */
export function ModColumn({
  slot,
  groups,
}: {
  slot: Slot
  groups: readonly ModGroup[]
}) {
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
        <p className="text-sm text-secondary-text">Keine Modifier in diesem Slot.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {groups.map((g) => (
            <ModGroupBlock key={`${g.slot}-${g.group}`} group={g} />
          ))}
        </div>
      )}
    </div>
  )
}
