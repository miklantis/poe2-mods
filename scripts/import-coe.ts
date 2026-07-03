/**
 * Import-Skript: Craft-of-Exile-Snapshot -> basis-zentriertes, schlankes Schema.
 *
 * Quelle der Wahrheit fuer die Gewichte ist der CoE-Snapshot unter
 * `data/_source/coe/` (siehe README dort). CoE rekonstruiert die Gewichte; die
 * Werte sind Schaetzungen. Kein automatischer Abruf (privater Endpunkt,
 * Org-Netzsperre) – der Snapshot wird manuell ersetzt.
 *
 * Ausgabe nach `data/<version>/`:
 *  - item_types.json: Item-Typen mit Varianten (CoE-Basen)
 *  - mods.json:       Modifier-Metadaten (Text mit #-Platzhaltern, Slot, Gruppe, Tags)
 *  - base_mods.json:  je Basis die rollbaren Mods mit Tiers (Itemstufe, Gewicht, Bereiche)
 * sowie `data/manifest.json` (aktive Version).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { z } from 'zod'

const SRC = path.resolve('data/_source/coe')
const OUT_ROOT = path.resolve('data')
const VERSION = '0.5.4'
const LEAGUE = 'Return of the Ancients'

/** Entfernt den JS-Wrapper `poecX={...};` und parst den JSON-Rumpf. */
function loadCoe<T>(file: string): T {
  const raw = readFileSync(path.join(SRC, file), 'utf8').trim()
  const body = raw.slice(raw.indexOf('=') + 1).replace(/;\s*$/, '')
  return JSON.parse(body) as T
}

// ---- Rohtypen (nur was wir brauchen) ------------------------------------
interface RawSeqInd<T> {
  seq: T[]
  ind?: Record<string, unknown>
}
interface RawModifier {
  id_modifier: string
  affix: string
  id_mgroup: string
  name_modifier: string
  modgroups: string | null
  mtypes: string | null
}
interface RawBase {
  id_base: string
  id_bgroup: string
  name_base: string
}
interface RawBgroup {
  id_bgroup: string
  name_bgroup: string
}
interface RawMtype {
  id_mtype: string
  poedb_id: string
}
interface RawTier {
  ilvl: string
  weighting: string
  nvalues: string
}
interface RawData {
  modifiers: RawSeqInd<RawModifier>
  bases: RawSeqInd<RawBase>
  bgroups: RawSeqInd<RawBgroup>
  mtypes: RawSeqInd<RawMtype>
  tiers: Record<string, Record<string, RawTier[]>>
  basemods: Record<string, string[]>
}
interface RawLang {
  base: Record<string, string>
}

// ---- Ziel-Schema (Zod = Quelle der Wahrheit) ----------------------------
const slotSchema = z.enum(['prefix', 'suffix'])

const modSchema = z.object({
  id: z.string(),
  text: z.string(),
  slot: slotSchema,
  group: z.string(),
  tags: z.array(z.string()),
})
const modsFileSchema = z.array(modSchema)

const tierSchema = z.object({
  ilvl: z.number().int(),
  weight: z.number().int(),
  values: z.array(z.tuple([z.number(), z.number()])),
})
const baseModSchema = z.object({
  mod: z.string(),
  tiers: z.array(tierSchema).min(1),
})
const baseModsFileSchema = z.record(z.string(), z.array(baseModSchema))

const variantSchema = z.object({ base: z.string(), label: z.string() })
const itemTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  variants: z.array(variantSchema).min(1),
})
const itemTypesFileSchema = z.array(itemTypeSchema)

// ---- Ableitung Item-Typ + Variante aus dem Basisnamen -------------------
const ATTR_LABEL: Record<string, { label: string; order: number }> = {
  STR: { label: 'Stärke', order: 0 },
  DEX: { label: 'Geschicklichkeit', order: 1 },
  INT: { label: 'Intelligenz', order: 2 },
  'STR/DEX': { label: 'Stärke / Geschick', order: 3 },
  'STR/INT': { label: 'Stärke / Intelligenz', order: 4 },
  'DEX/INT': { label: 'Geschick / Intelligenz', order: 5 },
  'STR/DEX/INT': { label: 'Alle Attribute', order: 6 },
}
const ELEMENT_LABEL: Record<string, string> = {
  Fire: 'Fire',
  Ice: 'Cold',
  Lightning: 'Lightning',
  Chaos: 'Chaos',
  Physical: 'Physical',
}

interface ParsedBase {
  itemType: string
  label: string
  order: number
}
function parseBase(name: string): ParsedBase {
  const attr = name.match(
    /^(.+?) \((STR|DEX|INT|STR\/DEX|STR\/INT|DEX\/INT|STR\/DEX\/INT)\)$/,
  )
  if (attr) {
    const a = ATTR_LABEL[attr[2]]
    return { itemType: attr[1], label: a.label, order: a.order }
  }
  const elem = name.match(/^(Fire|Ice|Lightning|Chaos|Physical) (Wand|Staff)$/)
  if (elem) {
    return { itemType: elem[2], label: ELEMENT_LABEL[elem[1]], order: 10 }
  }
  return { itemType: name, label: 'Standard', order: -1 }
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function parseValues(nvalues: string): [number, number][] {
  const arr = JSON.parse(nvalues) as unknown
  if (!Array.isArray(arr)) return []
  return arr.map((pair) => {
    if (Array.isArray(pair)) {
      const min = Number(pair[0])
      const max = Number(pair.length > 1 ? pair[1] : pair[0])
      return [min, max] as [number, number]
    }
    const v = Number(pair)
    return [v, v] as [number, number]
  })
}

// ---- Hauptlauf ----------------------------------------------------------
function main(): void {
  const data = loadCoe<RawData>('poec_data.json')
  const lang = loadCoe<RawLang>('poec_lang_us.json')

  const mtypeById = new Map(
    data.mtypes.seq.map((m) => [m.id_mtype, m.poedb_id]),
  )
  const bgroupById = new Map(
    data.bgroups.seq.map((g) => [g.id_bgroup, g.name_bgroup]),
  )
  const modById = new Map(data.modifiers.seq.map((m) => [m.id_modifier, m]))
  const baseName = (id: string, fallback: string): string =>
    lang.base[id] ?? fallback

  const tagsOf = (m: RawModifier): string[] =>
    (m.mtypes ?? '')
      .split('|')
      .filter(Boolean)
      .map((id) => mtypeById.get(id))
      .filter((t): t is string => Boolean(t))

  const groupOf = (m: RawModifier): string => {
    try {
      const g = JSON.parse(m.modgroups ?? '[]') as string[]
      return g[0] ?? m.id_modifier
    } catch {
      return m.id_modifier
    }
  }

  // item_types + variants, base_mods, und gesammelte Mod-Metadaten.
  interface TypeAcc {
    name: string
    category: string
    variants: { base: string; label: string; order: number }[]
  }
  const types = new Map<string, TypeAcc>()
  const baseModsOut: Record<
    string,
    { mod: string; tiers: { ilvl: number; weight: number; values: [number, number][] }[] }[]
  > = {}
  const usedMods = new Set<string>()

  for (const base of data.bases.seq) {
    const bid = base.id_base
    const modIds = data.basemods[bid] ?? []
    const rows: {
      mod: string
      tiers: { ilvl: number; weight: number; values: [number, number][] }[]
    }[] = []

    for (const mid of modIds) {
      const m = modById.get(mid)
      if (!m) continue
      if (m.affix !== 'prefix' && m.affix !== 'suffix') continue
      if (m.id_mgroup !== '1') continue // nur der normale Basis-Pool
      const rawTiers = data.tiers[mid]?.[bid]
      if (!rawTiers || rawTiers.length === 0) continue
      const tiers = rawTiers
        .map((t) => ({
          ilvl: parseInt(t.ilvl, 10),
          weight: parseInt(t.weighting, 10),
          values: parseValues(t.nvalues),
        }))
        .filter((t) => t.weight > 0)
      if (tiers.length === 0) continue
      rows.push({ mod: mid, tiers })
      usedMods.add(mid)
    }

    if (rows.length === 0) continue // Basen ohne rollbare Mods ueberspringen

    baseModsOut[bid] = rows

    // Item-Typ + Variante ableiten und einsortieren.
    const parsed = parseBase(baseName(bid, base.name_base))
    const typeId = slugify(parsed.itemType)
    const acc =
      types.get(typeId) ??
      ({
        name: parsed.itemType,
        category: bgroupById.get(base.id_bgroup) ?? 'Other',
        variants: [],
      } satisfies TypeAcc)
    acc.variants.push({ base: bid, label: parsed.label, order: parsed.order })
    types.set(typeId, acc)
  }

  // Mods-Metadaten (dedupliziert) nur fuer verwendete Mods.
  const mods = [...usedMods].map((mid) => {
    const m = modById.get(mid)!
    return {
      id: mid,
      text: m.name_modifier,
      slot: m.affix as 'prefix' | 'suffix',
      group: groupOf(m),
      tags: tagsOf(m),
    }
  })

  // Item-Typen zusammenbauen: Varianten sortieren, doppelte Labels entschaerfen.
  const itemTypes = [...types.entries()]
    .map(([id, acc]) => {
      const variants = acc.variants
        .slice()
        .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
        .map((v) => ({ base: v.base, label: v.label }))
      return { id, name: acc.name, category: acc.category, variants }
    })
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))

  // Validierung gegen das Ziel-Schema.
  const modsValid = modsFileSchema.parse(mods)
  const baseModsValid = baseModsFileSchema.parse(baseModsOut)
  const itemTypesValid = itemTypesFileSchema.parse(itemTypes)

  const outDir = path.join(OUT_ROOT, VERSION)
  mkdirSync(outDir, { recursive: true })
  writeFileSync(path.join(outDir, 'mods.json'), JSON.stringify(modsValid))
  writeFileSync(path.join(outDir, 'base_mods.json'), JSON.stringify(baseModsValid))
  writeFileSync(path.join(outDir, 'item_types.json'), JSON.stringify(itemTypesValid))

  const manifest = {
    current: VERSION,
    versions: [VERSION],
    leagueLabel: LEAGUE,
    source: 'Craft of Exile (Schätzwerte), Snapshot data/_source/coe',
    generatedAt: new Date().toISOString(),
  }
  writeFileSync(
    path.join(OUT_ROOT, 'manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n',
  )

  // Kurzbericht.
  const totalTiers = Object.values(baseModsValid).reduce(
    (a, rows) => a + rows.reduce((s, r) => s + r.tiers.length, 0),
    0,
  )
  console.log(
    `Fertig: ${itemTypesValid.length} Item-Typen, ${
      Object.keys(baseModsValid).length
    } Basen, ${modsValid.length} Mods, ${totalTiers} Tiers.`,
  )
}

main()
