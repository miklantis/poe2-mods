/**
 * Import-Skript: repoe-fork poe2-Export -> normalisiertes, schlankes Schema.
 *
 * Quelle der Wahrheit fuer Spieldaten sind die statischen JSON-Exporte von
 * repoe-fork/poe2 (kein Scraping). Das Skript zieht die Rohdateien, filtert
 * und slimt sie auf die Felder, die der Browser braucht, validiert das
 * Ergebnis gegen die Zod-Schemas und legt es versioniert unter
 * data/<version>/ ab. data/manifest.json wird fortgeschrieben.
 *
 * Ausfuehren:  npm run import
 *
 * Wiederholbar: bei neuem Patch erneut laufen lassen; neue Version landet in
 * einem eigenen Ordner, das Manifest wird ergaenzt.
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import {
  modsFileSchema,
  baseItemsFileSchema,
  itemTypesFileSchema,
  tagsFileSchema,
  manifestSchema,
  type Mod,
  type BaseItem,
  type ItemType,
  type Tag,
  type Manifest,
} from '../src/data/schema.ts'

const RAW_BASE = 'https://raw.githubusercontent.com/repoe-fork/poe2/master'
const DATA_BASE = `${RAW_BASE}/data`
const OUT_ROOT = path.resolve(import.meta.dirname, '..', 'data')

// --- Rohdaten-Formen (nur was wir lesen) ---
interface RawItemClass {
  category: string | null
  category_id: string | null
  name: string
}
interface RawBaseItem {
  domain: string
  drop_level: number
  implicits: string[]
  item_class: string
  name: string
  release_state: string
  tags: string[]
  requirements: {
    level: number
    strength: number
    dexterity: number
    intelligence: number
  } | null
}
interface RawSpawnWeight {
  tag: string
  weight: number
}
interface RawStat {
  id: string
  min: number
  max: number
}
interface RawMod {
  domain: string
  generation_type: string
  name: string
  type: string
  groups: string[]
  required_level: number
  stats: RawStat[]
  text: string | null
  spawn_weights: RawSpawnWeight[]
  implicit_tags: string[]
  adds_tags: string[]
  is_essence_only: boolean
}
interface RawTagDetail {
  name: string
  used_in_crafting: boolean
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Fetch fehlgeschlagen (${res.status}): ${url}`)
  return res.text()
}

async function fetchJson<T>(url: string): Promise<T> {
  return JSON.parse(await fetchText(url)) as T
}

async function main(): Promise<void> {
  console.log('Ziehe Export-Version ...')
  const version = (await fetchText(`${RAW_BASE}/version.txt`)).trim()
  console.log(`Export-Version: ${version}`)

  console.log('Lade Rohdaten ...')
  const [itemClasses, tagList, tagDetails, baseItemsRaw, modsRaw] =
    await Promise.all([
      fetchJson<Record<string, RawItemClass>>(`${DATA_BASE}/item_classes.json`),
      fetchJson<string[]>(`${DATA_BASE}/tags.json`),
      fetchJson<Record<string, RawTagDetail>>(`${DATA_BASE}/tag_details.json`),
      fetchJson<Record<string, RawBaseItem>>(`${DATA_BASE}/base_items.json`),
      fetchJson<Record<string, RawMod>>(`${DATA_BASE}/mods.json`),
    ])

  // --- base_items: nur released ---
  const baseItems: BaseItem[] = []
  const basesByClass = new Map<string, RawBaseItem[]>()
  for (const [id, v] of Object.entries(baseItemsRaw)) {
    if (v.release_state !== 'released') continue
    baseItems.push({
      id,
      name: v.name,
      itemClass: v.item_class,
      tags: v.tags,
      dropLevel: v.drop_level,
      implicits: v.implicits,
      requirements: v.requirements,
    })
    const list = basesByClass.get(v.item_class) ?? []
    list.push(v)
    basesByClass.set(v.item_class, list)
  }

  // --- tags: id + Anzeigename + crafting-relevant ---
  const tags: Tag[] = tagList.map((id) => ({
    id,
    name: tagDetails[id]?.name ?? '',
    usedInCrafting: tagDetails[id]?.used_in_crafting ?? false,
  }))

  // --- mods: domain item, prefix/suffix, mind. ein Spawn-Gewicht > 0.
  // spawn_weights bleiben vollstaendig und in Reihenfolge (erster passender
  // Tag gewinnt; Eintraege mit Gewicht 0 schliessen gezielt aus). ---
  const mods: Mod[] = []
  const craftableTags = new Set<string>()
  for (const [id, v] of Object.entries(modsRaw)) {
    if (v.domain !== 'item') continue
    if (v.generation_type !== 'prefix' && v.generation_type !== 'suffix') continue
    if (!v.spawn_weights?.some((w) => w.weight > 0)) continue
    // Platzhalter-Mods (Name "TBD", text null) sind unfertig -> auslassen.
    if (v.text == null) continue
    for (const w of v.spawn_weights) if (w.weight > 0) craftableTags.add(w.tag)
    mods.push({
      id,
      name: v.name,
      type: v.type,
      groups: v.groups,
      slot: v.generation_type,
      requiredLevel: v.required_level,
      stats: v.stats.map((s) => ({ id: s.id, min: s.min, max: s.max })),
      text: v.text,
      spawnWeights: v.spawn_weights.map((w) => ({ tag: w.tag, weight: w.weight })),
      implicitTags: v.implicit_tags,
      addsTags: v.adds_tags,
      isEssenceOnly: v.is_essence_only,
    })
  }

  // --- item_types: Klassen mit released Basen, auf die craftbare Mods
  // rollen koennen (mind. eine Basis traegt einen craftbaren Tag). Das
  // laesst Nicht-Ausruestung wie Mikrotransaktionen/Deko/Relikte weg. ---
  const itemTypes: ItemType[] = []
  for (const [classId, bases] of basesByClass) {
    const c = itemClasses[classId]
    if (!c || !c.name) continue
    const craftable = bases.some((b) => b.tags.some((t) => craftableTags.has(t)))
    if (!craftable) continue
    itemTypes.push({ id: classId, name: c.name, category: c.category_id })
  }
  itemTypes.sort((a, b) => a.name.localeCompare(b.name))

  // base_items auf die behaltenen Item-Klassen beschraenken (der Browser
  // zeigt nur diese Typen; Basen anderer Klassen waeren Ballast).
  const keptClasses = new Set(itemTypes.map((t) => t.id))
  const baseItemsKept = baseItems.filter((b) => keptClasses.has(b.itemClass))

  // --- validieren ---
  console.log('Validiere gegen Zod-Schemas ...')
  modsFileSchema.parse(mods)
  baseItemsFileSchema.parse(baseItemsKept)
  itemTypesFileSchema.parse(itemTypes)
  tagsFileSchema.parse(tags)

  // --- schreiben ---
  const outDir = path.join(OUT_ROOT, version)
  await mkdir(outDir, { recursive: true })
  await writeFile(path.join(outDir, 'mods.json'), JSON.stringify(mods))
  await writeFile(path.join(outDir, 'base_items.json'), JSON.stringify(baseItemsKept))
  await writeFile(path.join(outDir, 'item_types.json'), JSON.stringify(itemTypes))
  await writeFile(path.join(outDir, 'tags.json'), JSON.stringify(tags))

  // --- Manifest fortschreiben ---
  const manifestPath = path.join(OUT_ROOT, 'manifest.json')
  let versions: string[] = [version]
  let leagueLabel: string | null = null
  if (existsSync(manifestPath)) {
    const prev = manifestSchema.parse(
      JSON.parse(await readFile(manifestPath, 'utf8')),
    )
    versions = Array.from(new Set([...prev.versions, version])).sort()
    leagueLabel = prev.leagueLabel
  }
  const manifest: Manifest = {
    current: version,
    versions,
    leagueLabel,
    source: `${DATA_BASE} (repoe-fork/poe2)`,
    generatedAt: new Date().toISOString(),
  }
  manifestSchema.parse(manifest)
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n')

  console.log('Fertig.')
  console.log(
    `  Version ${version}: ${mods.length} Mods, ${baseItemsKept.length} Basen, ` +
      `${itemTypes.length} Item-Typen, ${tags.length} Tags`,
  )
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
