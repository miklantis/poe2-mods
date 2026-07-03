/**
 * Import-Skript: repoe-fork poe2-Export -> mod-zentriertes, schlankes Schema.
 *
 * Quelle der Wahrheit fuer Spieldaten ist der statische JSON-Export von
 * repoe-fork/poe2 (Branch master; kein Scraping). Das Skript zieht die
 * Rohdateien, filtert und slimt sie auf die Felder, die der Browser braucht,
 * gruppiert die einzelnen repoe-Mod-Eintraege zu Modifier-Familien mit Tiers,
 * validiert das Ergebnis gegen die Zod-Schemas (src/data/schema.repoe.ts) und
 * legt es versioniert unter data/<version>/ ab.
 *
 * repoe legt nur binaere Spawn-Gewichte offen (0/1); es gibt daher kein
 * Gewichtsfeld und keine Wahrscheinlichkeit. Die Eignung eines Mods fuer eine
 * Basis ergibt sich daraus, ob die Basis einen der Eignungs-Tags traegt.
 *
 * Herkuenfte (origin):
 *  - rollable:   domain item, generation_type prefix/suffix (inkl. der
 *    Genesis-Tree-Mods ueber die Tags genesis_tree_caster/-minion).
 *  - corrupted:  generation_type corrupted (kein Slot).
 *  - desecrated: domain desecrated (Boss-Tags ulaman/amanamu/kurgal).
 *  - essence:    generation_type essence (kein Slot).
 *
 * Ausfuehren:  npm run import:repoe
 *
 * manifest.json wird bewusst NICHT angefasst: waehrend der Migration bleibt die
 * App auf der CoE-Version. Das Umschalten passiert erst in einem spaeteren
 * Schritt.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  modsFileSchema,
  baseItemsFileSchema,
  itemTypesFileSchema,
  tagsFileSchema,
  type Mod,
  type Tier,
  type BaseItem,
  type ItemType,
  type Variant,
  type Tag,
  type Slot,
  type Origin,
} from '../src/data/schema.repoe.ts'

const RAW_BASE = 'https://raw.githubusercontent.com/repoe-fork/poe2/master'
const DATA_BASE = `${RAW_BASE}/data`
const OUT_ROOT = path.resolve(import.meta.dirname, '..', 'data')

// --- Rohdaten-Formen (nur was wir lesen) ---
interface RawItemClass {
  category_id: string | null
  name: string
}
interface RawBaseItem {
  domain: string
  item_class: string
  name: string
  release_state: string
  tags: string[]
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
  required_level: number
  stats: RawStat[]
  text: string | null
  spawn_weights: RawSpawnWeight[]
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

/** Herkunft aus domain + generation_type ableiten; null = nicht relevant. */
function originOf(m: RawMod): Origin | null {
  if (m.domain === 'desecrated') {
    if (m.generation_type === 'prefix' || m.generation_type === 'suffix') {
      return 'desecrated'
    }
    return null
  }
  if (m.domain !== 'item') return null
  if (m.generation_type === 'prefix' || m.generation_type === 'suffix') {
    return 'rollable'
  }
  if (m.generation_type === 'corrupted') return 'corrupted'
  if (m.generation_type === 'essence') return 'essence'
  return null
}

/** Slot: nur rollbare und desecrated Mods belegen einen Praefix/Suffix-Slot. */
function slotOf(m: RawMod, origin: Origin): Slot | null {
  if (origin === 'rollable' || origin === 'desecrated') {
    return m.generation_type === 'prefix' ? 'prefix' : 'suffix'
  }
  return null
}

// --- Ableitung Attribut-Variante aus Basis-Tags -------------------------
const ATTR_LABEL: { tag: string; label: string; order: number }[] = [
  { tag: 'str_dex_int_armour', label: 'Alle Attribute', order: 6 },
  { tag: 'str_dex_armour', label: 'Stärke / Geschick', order: 3 },
  { tag: 'str_int_armour', label: 'Stärke / Intelligenz', order: 4 },
  { tag: 'dex_int_armour', label: 'Geschick / Intelligenz', order: 5 },
  { tag: 'str_armour', label: 'Stärke', order: 0 },
  { tag: 'dex_armour', label: 'Geschicklichkeit', order: 1 },
  { tag: 'int_armour', label: 'Intelligenz', order: 2 },
]
function attrOf(tags: string[]): { label: string; order: number } | null {
  for (const a of ATTR_LABEL) if (tags.includes(a.tag)) return a
  return null
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

  // --- Mods zu Familien gruppieren -------------------------------------
  // Familienschluessel: origin + slot + type. Innerhalb einer Familie sind die
  // einzelnen repoe-Eintraege die Tiers (nach Itemstufe sortiert). Eignungs-Tags
  // sind alle Spawn-Tags mit Gewicht > 0 ueber alle Tiers.
  interface FamAcc {
    id: string
    slot: Slot | null
    origin: Origin
    tags: Set<string>
    rows: { row: RawMod; id: string }[]
  }
  const fams = new Map<string, FamAcc>()
  const craftableTags = new Set<string>()

  for (const [id, v] of Object.entries(modsRaw)) {
    const origin = originOf(v)
    if (origin === null) continue
    if (v.text == null) continue // Platzhalter/unfertig
    const positive = v.spawn_weights.filter((w) => w.weight > 0)
    if (positive.length === 0) continue
    const slot = slotOf(v, origin)
    const key = `${origin}:${slot ?? 'x'}:${v.type}`
    let fam = fams.get(key)
    if (!fam) {
      fam = { id: key, slot, origin, tags: new Set(), rows: [] }
      fams.set(key, fam)
    }
    for (const w of positive) fam.tags.add(w.tag)
    fam.rows.push({ row: v, id })
    if (origin === 'rollable') {
      for (const w of positive) craftableTags.add(w.tag)
    }
  }

  const mods: Mod[] = []
  for (const fam of fams.values()) {
    const tiers: Tier[] = fam.rows
      .map(({ row, id }) => ({
        id,
        ilvl: row.required_level,
        name: row.name,
        text: row.text ?? '',
        values: row.stats.map(
          (s) => [s.min, s.max] as [number, number],
        ),
      }))
      .sort((a, b) => a.ilvl - b.ilvl || a.id.localeCompare(b.id))
    const top = tiers[tiers.length - 1]
    mods.push({
      id: fam.id,
      text: top.text,
      slot: fam.slot,
      origin: fam.origin,
      tags: Array.from(fam.tags).sort(),
      tiers,
    })
  }
  mods.sort((a, b) => a.id.localeCompare(b.id))

  // --- base_items: nur released, plus nach Klasse gruppieren -----------
  const basesByClass = new Map<string, RawBaseItem[]>()
  const baseItemsAll: BaseItem[] = []
  const idOfRaw = new Map<RawBaseItem, string>()
  for (const [id, v] of Object.entries(baseItemsRaw)) {
    if (v.release_state !== 'released') continue
    baseItemsAll.push({ id, name: v.name, itemClass: v.item_class, tags: v.tags })
    idOfRaw.set(v, id)
    const list = basesByClass.get(v.item_class) ?? []
    list.push(v)
    basesByClass.set(v.item_class, list)
  }

  // --- item_types: Klassen mit released Basen, die einen craftbaren Tag
  // tragen (mind. ein rollbarer Mod kann darauf rollen). Filtert
  // Nicht-Ausruestung (Waehrung/Deko) weg. Varianten: Attribut-Auspraegung
  // ueber Basis-Tags, sonst eine Variante je Basis. ------------------------
  const itemTypes: ItemType[] = []
  for (const [classId, bases] of basesByClass) {
    const c = itemClasses[classId]
    if (!c || !c.name) continue
    const craftableBases = bases.filter((b) =>
      b.tags.some((t) => craftableTags.has(t)),
    )
    if (craftableBases.length === 0) continue

    // Variante je Attribut, falls vorhanden; sonst je Basis.
    const byAttr = new Map<string, Variant>()
    const plainVariants: Variant[] = []
    const attrOrder = new Map<string, number>()
    for (const b of craftableBases) {
      const id = idOfRaw.get(b) ?? b.name
      const a = attrOf(b.tags)
      if (a) {
        if (!byAttr.has(a.label)) {
          byAttr.set(a.label, { base: id, label: a.label })
          attrOrder.set(a.label, a.order)
        }
      } else {
        plainVariants.push({ base: id, label: b.name })
      }
    }
    let variants: Variant[]
    if (byAttr.size > 0) {
      variants = Array.from(byAttr.values()).sort(
        (x, y) => (attrOrder.get(x.label) ?? 0) - (attrOrder.get(y.label) ?? 0),
      )
    } else {
      variants = plainVariants.sort((x, y) => x.label.localeCompare(y.label))
    }
    if (variants.length === 0) continue
    itemTypes.push({
      id: classId,
      name: c.name,
      category: c.category_id ?? c.name,
      variants,
    })
  }
  itemTypes.sort((a, b) => a.name.localeCompare(b.name))

  // base_items auf die behaltenen Klassen beschraenken
  const keptClasses = new Set(itemTypes.map((t) => t.id))
  const baseItems = baseItemsAll.filter((b) => keptClasses.has(b.itemClass))

  // --- tags: id + Anzeigename + crafting-relevant ---
  const tags: Tag[] = tagList.map((id) => ({
    id,
    name: tagDetails[id]?.name ?? '',
    usedInCrafting: tagDetails[id]?.used_in_crafting ?? false,
  }))

  // --- validieren ---
  console.log('Validiere gegen Zod-Schemas ...')
  modsFileSchema.parse(mods)
  baseItemsFileSchema.parse(baseItems)
  itemTypesFileSchema.parse(itemTypes)
  tagsFileSchema.parse(tags)

  // --- schreiben (manifest.json bleibt unangetastet) ---
  const outDir = path.join(OUT_ROOT, version)
  await mkdir(outDir, { recursive: true })
  await writeFile(path.join(outDir, 'mods.json'), JSON.stringify(mods))
  await writeFile(
    path.join(outDir, 'base_items.json'),
    JSON.stringify(baseItems),
  )
  await writeFile(
    path.join(outDir, 'item_types.json'),
    JSON.stringify(itemTypes),
  )
  await writeFile(path.join(outDir, 'tags.json'), JSON.stringify(tags))

  const byOrigin = new Map<Origin, number>()
  for (const m of mods) byOrigin.set(m.origin, (byOrigin.get(m.origin) ?? 0) + 1)
  console.log('Fertig.')
  console.log(
    `  Version ${version}: ${mods.length} Modifier-Familien ` +
      `(${Array.from(byOrigin).map(([o, n]) => `${o}:${n}`).join(', ')}), ` +
      `${baseItems.length} Basen, ${itemTypes.length} Item-Typen, ${tags.length} Tags`,
  )
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
