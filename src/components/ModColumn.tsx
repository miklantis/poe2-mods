import type { DisplayGroup } from '@/lib/query/baseEngine'
import { ModTable } from '@/components/ModTable'
import type { Accent } from '@/components/ui/accent'
import { ACCENT_DOT, ACCENT_TEXT } from '@/components/ui/accent'
import { cn } from '@/lib/utils'

/**
 * Eine betitelte Mod-Tabelle. Titel und Akzent (Farbe) kommen von aussen, damit
 * dieselbe Spalte fuer rollbare Präfixe/Suffixe, die grünen Desecrated-Spalten
 * und die rote Corrupted-Tabelle dient. `showProbability` blendet die Chance aus.
 */
export function ModColumn({
  title,
  accent,
  keyNs,
  showProbability,
  groups,
  collapsedKeys,
  onToggle,
}: {
  title: string
  accent: Accent
  keyNs: string
  showProbability: boolean
  groups: readonly DisplayGroup[]
  collapsedKeys: ReadonlySet<string>
  onToggle: (key: string) => void
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className={cn('size-2 rounded-full', ACCENT_DOT[accent])} aria-hidden />
        <h3 className={cn('text-[13px] font-semibold', ACCENT_TEXT[accent])}>
          {title}
        </h3>
        <span className="font-mono text-[12px] tabular-nums text-muted-text">
          {groups.length}
        </span>
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-secondary-text">Keine Modifier.</p>
      ) : (
        <ModTable
          accent={accent}
          keyNs={keyNs}
          groups={groups}
          showProbability={showProbability}
          isCollapsed={(k) => collapsedKeys.has(k)}
          onToggle={onToggle}
        />
      )}
    </div>
  )
}
