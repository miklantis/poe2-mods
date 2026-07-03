import type { RepoeGroup } from '@/lib/query/repoeEngine'
import { fillModText } from '@/lib/modText'
import type { Accent } from '@/components/ui/accent'
import { ACCENT_DOT, ACCENT_TEXT } from '@/components/ui/accent'
import { cn } from '@/lib/utils'

/**
 * Essence-Spalte: eine betitelte, flache Tabelle mit genau einer Zeile je Mod.
 * Anders als `ModColumn`/`ModTable` (klappbare Familien mit Tier-Zeilen) gibt es
 * hier keine Stufen und kein Ein-/Ausklappen – die Stufen sind bereits zu einem
 * Wertebereich verdichtet. Gezeigt werden Modifier-Text (mit eingesetztem
 * Bereich) und die kleinste per Essence erreichbare Itemstufe. Keine Chance –
 * Essences setzen den Mod gezielt. Erwartet `RepoeGroup`s mit je genau einem
 * Tier (aus `essenceGroups`).
 */
export function EssenceColumn({
  title,
  accent,
  groups,
}: {
  title: string
  accent: Accent
  groups: readonly RepoeGroup[]
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
        <div className="overflow-x-auto rounded-lg border border-border-card">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-surface-header text-[11px] uppercase tracking-wide text-muted-text">
                <th className="px-2 py-1.5 font-semibold">Modifier</th>
                <th className="px-2 py-1.5 text-right font-semibold">Stufe</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => {
                const t = group.tiers[0]
                if (!t) return null
                return (
                  <tr key={group.id} className="border-t border-border-subtle">
                    <td className="px-2 py-1.5 text-[14px] text-body">
                      {fillModText(group.text, t.values)}
                    </td>
                    <td className="px-2 py-1.5 text-right font-mono text-[11.5px] tabular-nums text-muted-text">
                      {t.ilvl}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
