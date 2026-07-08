import type { AugmentEntry } from '@/data/schema.repoe'
import { cleanModText } from '@/lib/modText'
import type { Accent } from '@/components/ui/accent'
import { ACCENT_DOT, ACCENT_TEXT } from '@/components/ui/accent'
import { cn } from '@/lib/utils'

/**
 * Augment-/Bonded-Spalte: eine betitelte, flache Tabelle mit genau einer Zeile
 * je Effekt-Familie. Anders als der rollbare Pool gibt es hier weder Tier noch
 * Slot noch Itemstufe – die Werte sind fest (variiert der Wert zwischen
 * Rune-Stufen, steht ein `#`-Platzhalter im Text, wie auf poe2db). Es wird nur
 * der Effekt-Text gezeigt.
 */
export function AugmentColumn({
  title,
  accent,
  entries,
}: {
  title: string
  accent: Accent
  entries: readonly AugmentEntry[]
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className={cn('size-2 rounded-full', ACCENT_DOT[accent])} aria-hidden />
        <h3 className={cn('text-[13px] font-semibold', ACCENT_TEXT[accent])}>
          {title}
        </h3>
        <span className="font-mono text-[12px] tabular-nums text-muted-text">
          {entries.length}
        </span>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-secondary-text">Keine Modifier.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border-card">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-surface-header text-[11px] uppercase tracking-wide text-muted-text">
                <th className="px-2 py-1.5 font-semibold">Modifier</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-t border-border-subtle">
                  <td className="px-2 py-1.5 text-[14px] text-body">
                    {cleanModText(e.text)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
