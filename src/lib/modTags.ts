/**
 * Auswahl der filter-/anzeigbaren Tags. DOM-frei und testbar.
 *
 * `COLOR_TAG_ORDER` ist die Liste der im Filter angebotenen „primaeren" Tags,
 * in fester Reihenfolge (Schadensarten zuerst, dann Offensiv, Defensiv/
 * Ressourcen, Mechaniken, zuletzt die Desecrated-Herkuenfte). Interne/technische
 * Unter-Tags (z. B. `cold_resistance`, `bleed`, `minion_damage`, `defences`,
 * `drop`) werden bewusst weggelassen: In den Daten traegt jeder dieser Unter-Tags
 * zusaetzlich seinen Ober-Tag, ein Filter auf „Resistance"/„Ailment"/„Minion"
 * faengt sie also ohnehin. Nur konkrete Schadensarten bekommen im UI eine Farbe
 * (siehe `tagColors`), der Rest bleibt neutral.
 */

export const COLOR_TAG_ORDER = [
  // Schadensarten (farbig)
  'physical',
  'fire',
  'cold',
  'lightning',
  'chaos',
  // Offensiv
  'elemental',
  'attack',
  'caster',
  'damage',
  'critical',
  'speed',
  'minion',
  // Defensiv / Ressourcen
  'life',
  'mana',
  'energy_shield',
  'armour',
  'evasion',
  'resistance',
  // Mechaniken
  'ailment',
  'curse',
  'aura',
  'attribute',
  'gem',
  // Herkunft Desecrated (Abyssal-Bosse)
  'ulaman_mod',
  'amanamu_mod',
  'kurgal_mod',
] as const

export type ColorTag = (typeof COLOR_TAG_ORDER)[number]

const ORDER_INDEX = new Map<string, number>(
  COLOR_TAG_ORDER.map((t, i) => [t, i]),
)

/** Filter-/Anzeige-Tags einer Familie, in fester Reihenfolge, ohne Duplikate. */
export function displayTags(tags: readonly string[]): ColorTag[] {
  const present = new Set(tags.filter((t) => ORDER_INDEX.has(t)))
  return [...present].sort(
    (a, b) => ORDER_INDEX.get(a)! - ORDER_INDEX.get(b)!,
  ) as ColorTag[]
}
