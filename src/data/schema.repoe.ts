import { z } from 'zod'

/**
 * Zod-Schemas fuer die mod-zentrierten repoe-Daten (data/<version>/). Diese
 * Schemas sind die Quelle der Wahrheit fuer die Datenformen; die
 * TypeScript-Typen werden per z.infer daraus abgeleitet. Sie spiegeln das
 * Ziel-Schema aus scripts/import-repoe.ts.
 *
 * Anders als beim CoE-Schema (basis-zentriert, Gewichte an der Basis) haengen
 * hier die Tiers am Modifier selbst: mods.json liefert je Familie ihre Tiers
 * (Itemstufe, Werte-Bereiche). repoe legt nur binaere Spawn-Gewichte offen
 * (0/1), daher gibt es kein Gewichtsfeld und keine Wahrscheinlichkeit; die
 * Eignung eines Mods fuer eine Basis ergibt sich daraus, ob die Basis einen der
 * Eignungs-Tags (`tags`) traegt. Die konkreten Basis-Tags stehen in
 * base_items.json.
 */

export const slotSchema = z.enum(['prefix', 'suffix'])
export type Slot = z.infer<typeof slotSchema>

/**
 * Herkunft eines Mods – der Weg, auf dem er aufs Item kommt. Bestimmt, in
 * welchem Abschnitt der Browser ihn zeigt:
 * - rollable:   normaler Basis-Pool (Praefix/Suffix). Enthaelt auch die
 *   Genesis-Tree-Mods; die haengen nur an eigenen Eignungs-Tags
 *   (genesis_tree_caster / genesis_tree_minion), sind aber gewoehnliche
 *   rollbare Praefixe/Suffixe.
 * - corrupted:  ueber Corruption (Vaal) gesetzt; kein Praefix/Suffix-Slot.
 * - desecrated: ueber Desecration gesetzte Praefixe/Suffixe (Boss-Tags
 *   ulaman_mod / amanamu_mod / kurgal_mod).
 * - essence:    ueber Essence garantiert gesetzt (generation_type essence).
 */
export const originSchema = z.enum([
  'rollable',
  'corrupted',
  'desecrated',
  'essence',
])
export type Origin = z.infer<typeof originSchema>

/**
 * Ein Tier eines Modifiers: der einzelne repoe-Mod-Eintrag innerhalb einer
 * Familie. `id` ist die repoe-Mod-ID (eindeutig), `ilvl` das required_level,
 * `values` die Liste von [min, max]-Paaren aus den stats (mehrere Paare bei
 * Mods mit mehreren Werten, z. B. "adds X to Y"). `text` ist der
 * Original-Spieltext dieses Tiers, `name` der Affix-Name (kann leer sein).
 */
export const tierSchema = z.object({
  id: z.string(),
  ilvl: z.number().int(),
  name: z.string(),
  text: z.string(),
  values: z.array(z.tuple([z.number(), z.number()])),
})
export type Tier = z.infer<typeof tierSchema>

/**
 * Eine Modifier-Familie aus mods.json: die zusammengehoerigen Tiers plus
 * schlanke Metadaten. `slot` ist bei Corrupted- und Essence-Mods `null`, weil
 * sie keinen Praefix/Suffix-Slot belegen. `tags` sind die Eignungs-Tags (alle
 * Spawn-Tags mit Gewicht > 0 ueber alle Tiers); eine Basis kann den Mod
 * annehmen, wenn sie einen dieser Tags traegt. `text` ist der Anzeige-Text der
 * Familie (Text des hoechsten Tiers).
 */
export const modSchema = z.object({
  id: z.string(),
  text: z.string(),
  slot: slotSchema.nullable(),
  origin: originSchema,
  tags: z.array(z.string()),
  tiers: z.array(tierSchema).min(1),
})
export type Mod = z.infer<typeof modSchema>

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

/**
 * Eine Basis aus base_items.json: id, Anzeigename, Item-Klasse und ihre Tags.
 * Die Tags entscheiden ueber die Eignung (Abgleich gegen `Mod.tags`).
 */
export const baseItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  itemClass: z.string(),
  tags: z.array(z.string()),
})
export type BaseItem = z.infer<typeof baseItemSchema>

/** Ein Tag mit Anzeigename und Crafting-Relevanz. */
export const tagSchema = z.object({
  id: z.string(),
  name: z.string(),
  usedInCrafting: z.boolean(),
})
export type Tag = z.infer<typeof tagSchema>

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
export const baseItemsFileSchema = z.array(baseItemSchema)
export const tagsFileSchema = z.array(tagSchema)
export type ModsFile = z.infer<typeof modsFileSchema>
export type ItemTypesFile = z.infer<typeof itemTypesFileSchema>
export type BaseItemsFile = z.infer<typeof baseItemsFileSchema>
export type TagsFile = z.infer<typeof tagsFileSchema>
