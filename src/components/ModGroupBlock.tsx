import { ChevronDown, ChevronRight } from 'lucide-react'
import type { ModGroup } from '@/lib/query/engine'
import { modFamilyLabel } from '@/lib/modText'
import { displayTags } from '@/lib/modTags'
import { formatPercent } from '@/lib/format'
import { TierRow } from '@/components/TierRow'
import { TierBar } from '@/components/TierBar'
import { TagChipRow } from '@/components/ui/TagChip'

/**
 * Ein Block je Mod-Gruppe: Familien-Kopf (Text mit `#` statt Rollen, Typ-Chips,
 * kombinierte Chance im Slot) und darunter die Tiers. Der Kopf klappt den Block
 * ein/aus. Darstellung als Karten- oder Balken-Tiers.
 */
export function ModGroupBlock({
  group,
  view,
  collapsed,
  onToggle,
  slotMaxTierProbability,
}: {
  group: ModGroup
  view: 'cards' | 'bars'
  collapsed: boolean
  onToggle: () => void
  slotMaxTierProbability: number
}) {
  const top = group.mods[0]
  const family = top ? modFamilyLabel(top.mod.text) : group.group
  const tags = top ? displayTags(top.mod) : []
  const Chevron = collapsed ? ChevronRight : ChevronDown

  return (
    <div className="overflow-hidden rounded-lg border border-border-card bg-surface">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!collapsed}
        className="flex w-full items-center gap-2 border-b border-border-subtle bg-surface-group px-3 py-2 text-left transition-colors hover:bg-accent/40"
      >
        <Chevron
          className="size-3.5 shrink-0 text-muted-text"
          strokeWidth={2}
          aria-hidden
        />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-[13px] font-semibold text-heading">
              {family}
            </span>
            <TagChipRow tags={tags} />
          </span>
        </span>
        <span className="shrink-0 font-mono text-[12px] tabular-nums text-secondary-text">
          {formatPercent(group.probability)}
        </span>
      </button>
      {!collapsed && (
        <div className="divide-y divide-border-subtle">
          {group.mods.map((m) =>
            view === 'bars' ? (
              <TierBar
                key={m.mod.id}
                item={m}
                slot={group.slot}
                max={slotMaxTierProbability}
              />
            ) : (
              <TierRow key={m.mod.id} item={m} slot={group.slot} />
            ),
          )}
        </div>
      )}
    </div>
  )
}
