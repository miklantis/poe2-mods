import { z } from 'zod'

/**
 * Zod-Schemas fuer die basis-zentrierten CoE-Daten (data/<version>/). Diese
 * Schemas sind die Quelle der Wahrheit fuer die neuen Datenformen; die
 * TypeScript-Typen werden per z.infer daraus abgeleitet. Sie spiegeln das
 * Ziel-Schema aus scripts/import-coe.ts.
 *
 * Anders als beim alten repoe-Schema haengen die Spawn-Gewichte nicht am Mod,
 * sondern an der Basis: base_mods[basis] liefert je Mod dessen Tiers mit
 * Itemstufe (ilvl), Gewicht und Rollen-Bereichen (values). Die Mod-Metadaten
 * (Text, Slot, Gruppe, Tags) stehen in mods.json und werden per Mod-ID
 * nachgeschlagen.
 *
 * Genutzt wird dieses Schema vorerst nur von der Base-Query-Engine und ihren
 * Tests; der Loader zieht in einem spaeteren Schritt nach.
 */

export const slotSchema = z.enum(['prefix', 'suffix'])
export type Slot = z.infer<typeof slotSchema>

/**
 * Herkunft eines Mods – der Weg, auf dem er aufs Item kommt. Bestimmt, in
 * welchem Abschnitt der Browser ihn zeigt:
 * - rollable:   normaler, gewichteter Basis-Pool (Präfix/Suffix mit Chance).
 * - corrupted:  über Corruption (Vaal) gesetzt; kein Präfix/Suffix-Slot.
 * - desecrated: über Desecration (Well of Souls) gesetzte Präfixe/Suffixe.
 * - essence:    über Essence garantiert gesetzt; eigener, item-typ-bezogener
 *   Datenweg (essences.json). Der Wert steht in mods.json nur bei Mods, die
 *   ausschließlich über Essence kommen – Mods, die auch rollbar sind, behalten
 *   `rollable`. Essence-Zeilen greifen daher unabhängig vom Origin über
 *   essences.json auf die Mod-Metadaten zu.
 */
export const originSchema = z.enum([
  'rollable',
  'corrupted',
  'desecrated',
  'essence',
])
export type Origin = z.infer<typeof originSchema>

/**
 * Ein Mod aus mods.json: schlanke Metadaten, ohne Gewichte oder Tiers. `slot`
 * ist bei Corrupted-Mods `null`, weil sie keinen Präfix/Suffix-Slot belegen;
 * `origin` trennt die Herkünfte für die Reiter-Ansicht.
 */
export const modSchema = z.object({
  id: z.string(),
  text: z.string(),
  slot: slotSchema.nullable(),
  origin: originSchema,
  group: z.string(),
  tags: z.array(z.string()),
})
export type Mod = z.infer<typeof modSchema>

/**
 * Ein Tier eines Mods auf einer Basis: ab welcher Itemstufe (ilvl) rollbar,
 * mit welchem Gewicht und welchen Rollen-Bereichen. values ist eine Liste von
 * [min, max]-Paaren (mehrere Paare fuer Mods mit mehreren Werten, z. B.
 * "adds X to Y").
 */
export const tierSchema = z.object({
  ilvl: z.number().int(),
  weight: z.number().int(),
  values: z.array(z.tuple([z.number(), z.number()])),
})
export type Tier = z.infer<typeof tierSchema>

/** Je Mod-ID die Tiers, die dieser Mod auf der jeweiligen Basis annehmen kann. */
export const baseModSchema = z.object({
  mod: z.string(),
  tiers: z.array(tierSchema).min(1),
})
export type BaseMod = z.infer<typeof baseModSchema>

/** base_mods.json: Basis-ID -> Liste der rollbaren Mods mit ihren Tiers. */
export const baseModsFileSchema = z.record(z.string(), z.array(baseModSchema))
export type BaseModsFile = z.infer<typeof baseModsFileSchema>

/**
 * Ein über Essence garantierter Mod auf einer Basis. Anders als der rollbare
 * Pool gibt es hier kein Spawn-Gewicht: eine Essence setzt den Mod gezielt. Weil
 * derselbe Mod von mehreren Essence-Stufen (Lesser/Essence/Greater/…) mit
 * unterschiedlichen Werten kommt, sind die Stufen zu einer Zeile
 * zusammengefasst: `values` ist der Bereich über alle Stufen (elementweise
 * kleinstes Min bis größtes Max), `ilvl` die kleinste Itemstufe, ab der der Mod
 * per Essence erreichbar ist. Wertlose Flag-Mods haben `values: []`. Slot,
 * Text, Gruppe und Tags stehen in mods.json und werden per `mod`-ID
 * nachgeschlagen.
 */
export const essenceModSchema = z.object({
  mod: z.string(),
  ilvl: z.number().int(),
  values: z.array(z.tuple([z.number(), z.number()])),
})
export type EssenceMod = z.infer<typeof essenceModSchema>

/** essences.json: Basis-ID -> Liste der per Essence garantierten Mods. */
export const essencesFileSchema = z.record(
  z.string(),
  z.array(essenceModSchema),
)
export type EssencesFile = z.infer<typeof essencesFileSchema>

/** Eine Basis-Variante eines Item-Typs (z. B. Attribut-Auspraegung). */
export const variantSchema = z.object({ base: z.string(), label: z.string() })
export type Variant = z.infer<typeof variantSchema>

/** Ein Item-Typ mit seinen Basis-Varianten. */
export const itemTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  variants: z.array(variantSchema).min(1),
})
export type ItemType = z.infer<typeof itemTypeSchema>

/** data/manifest.json: aktive Version, verfuegbare Versionen, Herkunft. */
export const manifestSchema = z.object({
  current: z.string(),
  versions: z.array(z.string()),
  leagueLabel: z.string().nullable(),
  source: z.string(),
  generatedAt: z.string(),
})
export type Manifest = z.infer<typeof manifestSchema>

export const modsFileSchema = z.array(modSchema)
export const itemTypesFileSchema = z.array(itemTypeSchema)
export type ModsFile = z.infer<typeof modsFileSchema>
export type ItemTypesFile = z.infer<typeof itemTypesFileSchema>
