import { ChevronDown, ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import type { AugmentEntry } from '@/data/schema.repoe'
import { cleanModText, modFamilyLabel } from '@/lib/modText'
import type { Accent } from '@/components/ui/accent'
import { ACCENT_DOT, ACCENT_TEXT } from '@/components/ui/accent'
import { cn } from '@/lib/utils'

/**
 * Augment-/Bonded-Spalte: je Effekt-Familie eine klappbare Kopfzeile, darunter
 * die Quellen (Sockelbare je Stufe) mit ihrem konkreten Wert und dem benoetigten
 * Level. Anders als der rollbare Pool gibt es weder Tier-Rang noch Slot noch
 * Itemstufe – die Werte sind fest, variieren aber zwischen Stufen (Lesser …
 * Perfect), daher steht im Kopf der Familien-Text mit `#`.
 */
export function AugmentColumn({
  title,
  accent,
  keyNs,
  entries,
  collapsedKeys,
  onToggle,
}: {
  title: string
  accent: Accent
  keyNs: string
  entries: readonly AugmentEntry[]
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
                <th className="px-2 py-1.5 font-semibold">Quelle</th>
                <th className="px-2 py-1.5 font-semibold">Modifier</th>
                <th className="px-2 py-1.5 text-right font-semibold">Level</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => {
                const key = `${keyNs}-${e.id}`
                const collapsed = collapsedKeys.has(key)
                const Chevron = collapsed ? ChevronRight : ChevronDown
                return (
                  <FamilyRows key={key}>
                    <tr className="border-t border-border-subtle bg-surface-group">
                      <td colSpan={3} className="p-0">
                        <button
                          type="button"
                          onClick={() => onToggle(key)}
                          aria-expanded={!collapsed}
                          className="flex w-full items-center gap-2 px-2 py-1.5 text-left transition-colors hover:bg-accent/40"
                        >
                          <Chevron
                            className="size-3.5 shrink-0 text-muted-text"
                            strokeWidth={2}
                            aria-hidden
                          />
                          <span className="text-[14px] font-semibold text-body">
                            {modFamilyLabel(e.text)}
                          </span>
                        </button>
                      </td>
                    </tr>
                    {!collapsed &&
                      e.sources.map((s, i) => (
                        <tr
                          key={`${key}-${i}`}
                          className="border-t border-border-subtle"
                        >
                          <td className="px-2 py-1.5 text-[11.5px] text-muted-text">
                            {s.label}
                          </td>
                          <td className="px-2 py-1.5 text-[14px] text-body">
                            {cleanModText(s.text)}
                          </td>
                          <td className="px-2 py-1.5 text-right font-mono text-[11.5px] tabular-nums text-muted-text">
                            {s.level}
                          </td>
                        </tr>
                      ))}
                  </FamilyRows>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/** Gruppiert Kopf- und Quellen-Zeilen einer Familie ohne zusaetzliches DOM. */
function FamilyRows({ children }: { children: ReactNode }) {
  return <>{children}</>
}
