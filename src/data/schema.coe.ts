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

/** Ein Mod aus mods.json: schlanke Metadaten, ohne Gewichte oder Tiers. */
export const modSchema = z.object({
  id: z.string(),
  text: z.string(),
  slot: slotSchema,
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

export const modsFileSchema = z.array(modSchema)
export const itemTypesFileSchema = z.array(itemTypeSchema)
export type ModsFile = z.infer<typeof modsFileSchema>
export type ItemTypesFile = z.infer<typeof itemTypesFileSchema>
