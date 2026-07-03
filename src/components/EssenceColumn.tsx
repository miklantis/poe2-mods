import type { DisplayGroup } from '@/lib/query/baseEngine'
import { fillModText } from '@/lib/modText'
import { displayTags } from '@/lib/modTags'
import { TagChipRow } from '@/components/ui/TagChip'
import type { Accent } from '@/components/ui/accent'
import { ACCENT_DOT, ACCENT_TEXT } from '@/components/ui/accent'
import { cn } from '@/lib/utils'

/**
 * Essence-Spalte: eine betitelte, flache Tabelle mit genau einer Zeile je Mod.
 * Anders als `ModColumn`/`ModTable` (klappbare Familien mit Tier-Zeilen) gibt es
 * hier keine Stufen und kein Ein-/Ausklappen – die Stufen sind bereits zu einem
 * Wertebereich verdichtet. Gezeigt werden Modifier-Text (mit eingesetztem
 * Bereich) samt Typ-Tags und die kleinste per Essence erreichbare Itemstufe.
 * Keine Chance – Essences setzen den Mod gezielt.
 *
 * Erwartet `DisplayGroup`s mit je genau einem `ComputedMod` (aus
 * `runEssenceQuery`); Akzent und Titel kommen von aussen.
 */
export function EssenceColumn({
  title,
  accent,
  groups,
}: {
  title: string
  accent: Accent
  groups: readonly DisplayGroup[]
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className={cn('size-2 rounded-full', ACCENT_DOT[accent])} aria-hidden />
        <h3 className={cn('font-display text-[15px] font-bold', ACCENT_TEXT[accent])}>
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
                const mod = group.mods[0]
                if (!mod) return null
                return (
                  <tr
                    key={mod.mod.id}
                    className="border-t border-border-subtle"
                  >
                    <td className="px-2 py-1.5 text-[13px] text-body">
                      <span className="align-middle">
                        {fillModText(mod.mod.text, mod.values)}
                      </span>
                      <TagChipRow tags={displayTags(mod.mod)} />
                    </td>
                    <td className="px-2 py-1.5 text-right font-mono text-[11.5px] tabular-nums text-muted-text">
                      {mod.ilvl}
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
