import { ChevronDown, ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import type { ModGroup } from '@/lib/query/baseEngine'
import type { Slot } from '@/data/schema.coe'
import { modFamilyLabel, fillModText } from '@/lib/modText'
import { displayTags } from '@/lib/modTags'
import { formatPercent, formatWeight } from '@/lib/format'
import { TagChipRow } from '@/components/ui/TagChip'
import { cn } from '@/lib/utils'

const SLOT_TEXT: Record<Slot, string> = {
  prefix: 'text-prefix',
  suffix: 'text-suffix',
}

/**
 * Dichte Tabellen-Darstellung eines Slots: je Mod-Familie eine klappbare
 * Kopfzeile, darunter die Tiers als Tabellenzeilen. Auf schmalen Screens
 * horizontal scrollbar.
 */
export function ModTable({
  slot,
  groups,
  isCollapsed,
  onToggle,
}: {
  slot: Slot
  groups: readonly ModGroup[]
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
            <th className="px-2 py-1.5 text-right font-semibold">Gewicht</th>
            <th className="px-2 py-1.5 text-right font-semibold">Chance</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => {
            const key = `${group.slot}-${group.group}`
            const collapsed = isCollapsed(key)
            const top = group.mods[0]
            const family = top ? modFamilyLabel(top.mod.text) : group.group
            const tags = top ? displayTags(top.mod) : []
            const Chevron = collapsed ? ChevronRight : ChevronDown
            return (
              <FamilyRows key={key}>
                <tr className="border-t border-border-subtle bg-surface-group">
                  <td colSpan={5} className="p-0">
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
                      <span className="text-[12.5px] font-semibold text-heading">
                        {family}
                      </span>
                      <TagChipRow tags={tags} />
                      <span className="ml-auto font-mono text-[11.5px] tabular-nums text-secondary-text">
                        {formatPercent(group.probability)}
                      </span>
                    </button>
                  </td>
                </tr>
                {!collapsed &&
                  group.mods.map((m) => (
                    <tr
                      key={`${m.mod.id}-${m.tier}`}
                      className="border-t border-border-subtle"
                    >
                      <td className="px-2 py-1.5 font-mono text-[11.5px] tabular-nums text-muted-text">
                        T{m.tier}
                      </td>
                      <td className="px-2 py-1.5 text-[13px] text-body">
                        {fillModText(m.mod.text, m.values)}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono text-[11.5px] tabular-nums text-muted-text">
                        {m.ilvl}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono text-[11.5px] tabular-nums text-muted-text">
                        {formatWeight(m.weight)}
                      </td>
                      <td
                        className={cn(
                          'px-2 py-1.5 text-right font-mono text-[12px] tabular-nums',
                          SLOT_TEXT[slot],
                        )}
                      >
                        {formatPercent(m.probability)}
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
