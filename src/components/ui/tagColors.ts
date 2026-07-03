import type { ColorTag } from '@/lib/modTags'

/**
 * Zuordnung Tag -> Stilklassen (aktiver Zustand der Filter-Pill) und Label. Die
 * vollen Klassennamen stehen statisch im Code, damit der Tailwind-Scanner sie
 * erzeugt. Nur konkrete Schadensarten bekommen eine Farbe; alle uebrigen Tags
 * nutzen einen neutralen Aktiv-Stil (`NEUTRAL`), damit die Leiste ruhig bleibt.
 * Der inaktive Zustand kommt aus `TagFilterPill` und ist fuer alle gleich.
 */
const NEUTRAL = 'border-secondary-text/50 bg-surface-header text-body'

export const TAG_STYLE: Record<ColorTag, { cls: string; label: string }> = {
  // Schadensarten (farbig)
  physical: { cls: 'border-tag-physical/40 bg-tag-physical/10 text-tag-physical', label: 'Physical' },
  fire: { cls: 'border-tag-fire/40 bg-tag-fire/10 text-tag-fire', label: 'Fire' },
  cold: { cls: 'border-tag-cold/40 bg-tag-cold/10 text-tag-cold', label: 'Cold' },
  lightning: { cls: 'border-tag-lightning/40 bg-tag-lightning/10 text-tag-lightning', label: 'Lightning' },
  chaos: { cls: 'border-tag-chaos/40 bg-tag-chaos/10 text-tag-chaos', label: 'Chaos' },
  // Offensiv (neutral)
  elemental: { cls: NEUTRAL, label: 'Elemental' },
  attack: { cls: NEUTRAL, label: 'Attack' },
  caster: { cls: NEUTRAL, label: 'Caster' },
  damage: { cls: NEUTRAL, label: 'Damage' },
  critical: { cls: NEUTRAL, label: 'Critical' },
  speed: { cls: NEUTRAL, label: 'Speed' },
  minion: { cls: NEUTRAL, label: 'Minion' },
  // Defensiv / Ressourcen (neutral)
  life: { cls: NEUTRAL, label: 'Life' },
  mana: { cls: NEUTRAL, label: 'Mana' },
  energy_shield: { cls: NEUTRAL, label: 'Energy Shield' },
  armour: { cls: NEUTRAL, label: 'Armour' },
  evasion: { cls: NEUTRAL, label: 'Evasion' },
  resistance: { cls: NEUTRAL, label: 'Resistance' },
  // Mechaniken (neutral)
  ailment: { cls: NEUTRAL, label: 'Ailment' },
  curse: { cls: NEUTRAL, label: 'Curse' },
  aura: { cls: NEUTRAL, label: 'Aura' },
  attribute: { cls: NEUTRAL, label: 'Attribute' },
  gem: { cls: NEUTRAL, label: 'Gem' },
  // Herkunft Desecrated (neutral)
  ulaman_mod: { cls: NEUTRAL, label: 'Ulaman' },
  amanamu_mod: { cls: NEUTRAL, label: 'Amanamu' },
  kurgal_mod: { cls: NEUTRAL, label: 'Kurgal' },
}
