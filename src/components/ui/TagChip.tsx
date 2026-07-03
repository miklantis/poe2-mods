import type { ColorTag } from '@/lib/modTags'

/**
 * Farbiger Chip fuer einen Typ-Tag. Die vollen Klassennamen stehen statisch im
 * Code, damit der Tailwind-Scanner sie erkennt (dynamische `text-tag-${x}`
 * wuerden nicht erzeugt). Wird spaeter in Phase 4 fuer die Facet-Filter
 * wiederverwendet.
 */

const TAG_STYLE: Record<ColorTag, { cls: string; label: string }> = {
  physical: { cls: 'border-tag-physical/40 bg-tag-physical/10 text-tag-physical', label: 'Physical' },
  fire: { cls: 'border-tag-fire/40 bg-tag-fire/10 text-tag-fire', label: 'Fire' },
  cold: { cls: 'border-tag-cold/40 bg-tag-cold/10 text-tag-cold', label: 'Cold' },
  lightning: { cls: 'border-tag-lightning/40 bg-tag-lightning/10 text-tag-lightning', label: 'Lightning' },
  chaos: { cls: 'border-tag-chaos/40 bg-tag-chaos/10 text-tag-chaos', label: 'Chaos' },
  attack: { cls: 'border-tag-attack/40 bg-tag-attack/10 text-tag-attack', label: 'Attack' },
  caster: { cls: 'border-tag-caster/40 bg-tag-caster/10 text-tag-caster', label: 'Caster' },
  life: { cls: 'border-tag-life/40 bg-tag-life/10 text-tag-life', label: 'Life' },
  mana: { cls: 'border-tag-mana/40 bg-tag-mana/10 text-tag-mana', label: 'Mana' },
  resistance: { cls: 'border-tag-resistance/40 bg-tag-resistance/10 text-tag-resistance', label: 'Resistance' },
}

export function TagChip({ tag }: { tag: ColorTag }) {
  const style = TAG_STYLE[tag]
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-semibold leading-none ${style.cls}`}
    >
      {style.label}
    </span>
  )
}

/** Chip-Reihe fuer eine Mod-Familie; rendert nichts bei leerer Liste. */
export function TagChipRow({ tags }: { tags: readonly ColorTag[] }) {
  if (tags.length === 0) return null
  return (
    <span className="flex flex-wrap gap-1">
      {tags.map((t) => (
        <TagChip key={t} tag={t} />
      ))}
    </span>
  )
}
