/**
 * Warp-Runen: sechs Slot-gebundene Runen, jede mit eigenem Themen-Tag und
 * eigenem Praefix/Suffix-Pool (Herkunft `warp`). Die Mods tragen nur ihren
 * Themen-Tag; welche Rune auf welchen Item-Typ passt, steht nicht in den
 * Mod-Daten, sondern folgt der Slot-Bindung aus augments.json
 * (`RuneWarping…Influence` -> Kategorie):
 *
 *  - Waffen        -> destruction (Thrud's Might, Magnituden)
 *  - Helm          -> berserking  (Vorana's Carnage, Rage/Warcry)
 *  - Handschuhe    -> marksman + decay (Kolr's, Katla's)
 *  - Koerperruestung -> soul      (Medved's, Leben/Spirit)
 *  - Stiefel       -> chronomancy (Uhtred's, Dauer)
 *  - Talisman      -> destruction (wie Waffen; so auch auf poe2db)
 *
 * Andere Slots (Schild, Buckler, Focus, Ring, Amulett, Guertel, Quiver) haben
 * keine Warp-Rune.
 */

/** Anzeigename je Themen-Tag. Thrud's/Vorana's sind gesichert; die uebrigen
 * vier vorlaeufig (der Export fuehrt die vollen Namen nicht). */
export const WARP_LABEL: Record<string, string> = {
  destruction: "Thrud's Might",
  berserking: "Vorana's Carnage",
  marksman: "Kolr's Hunt",
  decay: "Katla's Decay",
  soul: "Medved's Soul",
  chronomancy: "Uhtred's Legacy",
}

/** Feste Reihenfolge der Themen (fuer stabile Anzeige). */
export const WARP_ORDER = [
  'destruction',
  'berserking',
  'marksman',
  'decay',
  'soul',
  'chronomancy',
] as const

/** Item-Typ-ID (item_types) -> passende Warp-Themen. Fehlt der Typ, gibt es
 * keinen Warp-Abschnitt. */
const WARP_BY_TYPE: Record<string, string[]> = {
  // Waffen
  Claw: ['destruction'],
  Dagger: ['destruction'],
  'One Hand Axe': ['destruction'],
  'One Hand Mace': ['destruction'],
  'One Hand Sword': ['destruction'],
  'Two Hand Axe': ['destruction'],
  'Two Hand Mace': ['destruction'],
  'Two Hand Sword': ['destruction'],
  Flail: ['destruction'],
  Spear: ['destruction'],
  Bow: ['destruction'],
  Crossbow: ['destruction'],
  Warstaff: ['destruction'],
  Wand: ['destruction'],
  Staff: ['destruction'],
  Sceptre: ['destruction'],
  FishingRod: ['destruction'],
  TrapTool: ['destruction'],
  Talisman: ['destruction'],
  // Ruestung
  Helmet: ['berserking'],
  Gloves: ['marksman', 'decay'],
  'Body Armour': ['soul'],
  Boots: ['chronomancy'],
}

/** Passende Warp-Themen fuer einen Item-Typ, in fester Reihenfolge. */
export function warpThemesFor(itemTypeId: string): string[] {
  const set = new Set(WARP_BY_TYPE[itemTypeId] ?? [])
  return WARP_ORDER.filter((t) => set.has(t))
}
