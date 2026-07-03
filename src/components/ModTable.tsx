import { ChevronDown, ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import type { RepoeGroup } from '@/lib/query/repoeEngine'
import { modFamilyLabel, tierValueText } from '@/lib/modText'
import type { Accent } from '@/components/ui/accent'

/**
 * Dichte Tabellen-Darstellung einer Spalte: je Mod-Familie eine klappbare
 * Kopfzeile, darunter die Tiers als Tabellenzeilen. Auf schmalen Screens
 * horizontal scrollbar. Ohne Spawn-Wahrscheinlichkeit (repoe fuehrt nur
 * Gewichte 0/1) – gezeigt werden Tier, Wertespanne und Itemstufe.
 */
export function ModTable({
  keyNs,
  groups,
  isCollapsed,
  onToggle,
}: {
  accent: Accent
  keyNs: string
  groups: readonly RepoeGroup[]
  isCollapsed: (key: string) => boolean
  onToggle: (key: string) => void
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border-card">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="bg-surface-header text-[11px] uppercase tracking-wide text-muted-text">
            <th className="px-2 py-1.5 font-semibold">Tier</th>
            <th className="px-2 py-1.5 font-semibold">Modifier</th>
            <th className="px-2 py-1.5 text-right font-semibold">Stufe</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => {
            const key = `${keyNs}-${group.id}`
            const collapsed = isCollapsed(key)
            const family = modFamilyLabel(group.text)
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
                        {family}
                      </span>
                    </button>
                  </td>
                </tr>
                {!collapsed &&
                  group.tiers.map((t) => (
                    <tr
                      key={t.id}
                      className="border-t border-border-subtle"
                    >
                      <td className="px-2 py-1.5 font-mono text-[11.5px] tabular-nums text-muted-text">
                        T{t.tier}
                      </td>
                      <td className="px-2 py-1.5 text-[14px] tabular-nums text-body">
                        {tierValueText(t.text, t.values)}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono text-[11.5px] tabular-nums text-muted-text">
                        {t.ilvl}
                      </td>
                    </tr>
                  ))}
              </FamilyRows>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/** Gruppiert Kopf- und Tier-Zeilen einer Familie ohne zusaetzliches DOM. */
function FamilyRows({ children }: { children: ReactNode }) {
  return <>{children}</>
}
