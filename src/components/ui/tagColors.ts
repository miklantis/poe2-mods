import type { ColorTag } from '@/lib/modTags'

/**
 * Zuordnung Typ-Tag -> Farbklassen und Label. Die vollen Klassennamen stehen
 * statisch im Code, damit der Tailwind-Scanner sie erzeugt (dynamische
 * `text-tag-${x}` wuerden nicht generiert). Genutzt von TagChip (Anzeige) und
 * TagFilterPill (Filter).
 */
export const TAG_STYLE: Record<ColorTag, { cls: string; label: string }> = {
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
