import { z } from 'zod'

/**
 * Zod-Schemas fuer die normalisierten Spieldaten. Diese Schemas sind die
 * Quelle der Wahrheit fuer die Datenformen; die TypeScript-Typen werden per
 * z.infer daraus abgeleitet. Sowohl das Import-Skript (Validierung der
 * Ausgabe) als auch die App (Validierung beim Laden) verwenden sie.
 */

export const slotSchema = z.enum(['prefix', 'suffix'])
export type Slot = z.infer<typeof slotSchema>

export const statRangeSchema = z.object({
  id: z.string(),
  min: z.number(),
  max: z.number(),
})
export type StatRange = z.infer<typeof statRangeSchema>

export const spawnWeightSchema = z.object({
  tag: z.string(),
  weight: z.number(),
})
export type SpawnWeight = z.infer<typeof spawnWeightSchema>

export const modSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  groups: z.array(z.string()),
  slot: slotSchema,
  requiredLevel: z.number(),
  stats: z.array(statRangeSchema),
  text: z.string(),
  spawnWeights: z.array(spawnWeightSchema),
  implicitTags: z.array(z.string()),
  addsTags: z.array(z.string()),
  isEssenceOnly: z.boolean(),
})
export type Mod = z.infer<typeof modSchema>

export const requirementsSchema = z
  .object({
    level: z.number(),
    strength: z.number(),
    dexterity: z.number(),
    intelligence: z.number(),
  })
  .nullable()
export type Requirements = z.infer<typeof requirementsSchema>

export const baseItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  itemClass: z.string(),
  tags: z.array(z.string()),
  dropLevel: z.number(),
  implicits: z.array(z.string()),
  requirements: requirementsSchema,
})
export type BaseItem = z.infer<typeof baseItemSchema>

export const itemTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string().nullable(),
})
export type ItemType = z.infer<typeof itemTypeSchema>

export const tagSchema = z.object({
  id: z.string(),
  name: z.string(),
  usedInCrafting: z.boolean(),
})
export type Tag = z.infer<typeof tagSchema>

export const manifestSchema = z.object({
  current: z.string(),
  versions: z.array(z.string()),
  leagueLabel: z.string().nullable(),
  source: z.string(),
  generatedAt: z.string(),
})
export type Manifest = z.infer<typeof manifestSchema>

export const modsFileSchema = z.array(modSchema)
export const baseItemsFileSchema = z.array(baseItemSchema)
export const itemTypesFileSchema = z.array(itemTypeSchema)
export const tagsFileSchema = z.array(tagSchema)
