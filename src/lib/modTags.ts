import type { Mod } from '@/data/schema'

/**
 * Auswahl der anzeigbaren Typ-Tags eines Mods fuer die Chips. DOM-frei und
 * testbar.
 *
 * Nur Tags mit definierter Farbe im Design-System werden angezeigt; Quelle sind
 * die `implicitTags` des Mods. Die Reihenfolge ist fest (Schadensarten zuerst,
 * dann Liefer-/Ressourcen-Tags), damit Chips ueber Mods hinweg konsistent
 * stehen.
 */

export const COLOR_TAG_ORDER = [
  'physical',
  'fire',
  'cold',
  'lightning',
  'chaos',
  'attack',
  'caster',
  'life',
  'mana',
  'resistance',
] as const

export type ColorTag = (typeof COLOR_TAG_ORDER)[number]

const ORDER_INDEX = new Map<string, number>(
  COLOR_TAG_ORDER.map((t, i) => [t, i]),
)

/** Anzeigbare Farb-Tags eines Mods, in fester Reihenfolge, ohne Duplikate. */
export function displayTags(mod: Mod): ColorTag[] {
  const present = new Set(mod.implicitTags.filter((t) => ORDER_INDEX.has(t)))
  return [...present].sort(
    (a, b) => ORDER_INDEX.get(a)! - ORDER_INDEX.get(b)!,
  ) as ColorTag[]
}
