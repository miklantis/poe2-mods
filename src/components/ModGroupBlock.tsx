import type { ModGroup } from '@/lib/query/engine'
import { modFamilyLabel } from '@/lib/modText'
import { formatPercent } from '@/lib/format'
import { TierRow } from '@/components/TierRow'

/**
 * Ein Block je Mod-Gruppe: oben das Familien-Label (Text mit `#` statt Rollen)
 * und die kombinierte Chance dieser Familie im Slot, darunter die Tiers.
 */
export function ModGroupBlock({ group }: { group: ModGroup }) {
  const top = group.mods[0]
  const family = top ? modFamilyLabel(top.mod.text) : group.group
  return (
    <div className="overflow-hidden rounded-lg border border-border-card bg-surface">
      <div className="flex items-baseline justify-between gap-3 border-b border-border-subtle bg-surface-group px-3 py-2">
        <span className="text-[13px] font-semibold text-heading">{family}</span>
        <span className="shrink-0 font-mono text-[12px] tabular-nums text-secondary-text">
          {formatPercent(group.probability)}
        </span>
      </div>
      <div className="divide-y divide-border-subtle">
        {group.mods.map((m) => (
          <TierRow key={m.mod.id} item={m} slot={group.slot} />
        ))}
      </div>
    </div>
  )
}
