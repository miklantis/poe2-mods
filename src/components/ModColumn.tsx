import { useMemo } from 'react'
import type { DisplayGroup } from '@/lib/query/baseEngine'
import type { ModView } from '@/components/ViewSwitcher'
import { ModGroupBlock } from '@/components/ModGroupBlock'
import { ModTable } from '@/components/ModTable'
import type { Accent } from '@/components/ui/accent'
import { ACCENT_DOT, ACCENT_TEXT } from '@/components/ui/accent'
import { cn } from '@/lib/utils'

/**
 * Eine Mod-Spalte mit Kopfzeile und der gewaehlten Darstellung. Titel und Akzent
 * (Farbe) kommen von aussen, damit dieselbe Spalte fuer Praefixe, Suffixe und
 * die flache Corrupted-Liste dient. `showProbability` blendet die Chance aus.
 */
export function ModColumn({
  title,
  accent,
  showProbability,
  groups,
  view,
  collapsedKeys,
  onToggle,
}: {
  title: string
  accent: Accent
  showProbability: boolean
  groups: readonly DisplayGroup[]
  view: ModView
  collapsedKeys: ReadonlySet<string>
  onToggle: (key: string) => void
}) {
  const keyOf = (g: DisplayGroup): string => `${accent}-${g.group}`

  // Groesste Tier-Chance in der Spalte fuer die Balken-Skalierung.
  const maxTierProbability = useMemo(() => {
    let max = 0
    for (const g of groups)
      for (const m of g.mods) if (m.probability > max) max = m.probability
    return max
  }, [groups])

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className={cn('size-2 rounded-full', ACCENT_DOT[accent])} aria-hidden />
        <h2 className={cn('font-display text-[15px] font-bold', ACCENT_TEXT[accent])}>
          {title}
        </h2>
        <span className="font-mono text-[12px] tabular-nums text-muted-text">
          {groups.length}
        </span>
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-secondary-text">Keine Modifier.</p>
      ) : view === 'table' ? (
        <ModTable
          accent={accent}
          groups={groups}
          showProbability={showProbability}
          isCollapsed={(k) => collapsedKeys.has(k)}
          onToggle={onToggle}
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {groups.map((g) => (
            <ModGroupBlock
              key={keyOf(g)}
              group={g}
              accent={accent}
              showProbability={showProbability}
              view={view === 'bars' ? 'bars' : 'cards'}
              collapsed={collapsedKeys.has(keyOf(g))}
              onToggle={() => onToggle(keyOf(g))}
              slotMaxTierProbability={maxTierProbability}
            />
          ))}
        </div>
      )}
    </div>
  )
}
