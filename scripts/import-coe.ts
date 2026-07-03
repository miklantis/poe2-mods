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
  nvalues: string | null
}
interface RawEssence {
  id_essence: string
  name_essence: string
  /** JSON-String: Basis-ID -> Gruppen von Mod-Einträgen {mod,id,ilvl}. */
  tiers: string
  corrupt: string
}
interface RawData {
  modifiers: RawSeqInd<RawModifier>
  bases: RawSeqInd<RawBase>
  bgroups: RawSeqInd<RawBgroup>
  mtypes: RawSeqInd<RawMtype>
  essences: RawSeqInd<RawEssence>
  tiers: Record<string, Record<string, RawTier[]>>
  basemods: Record<string, string[]>
}
interface RawLang {
  base: Record<string, string>
}

// ---- Ziel-Schema (Zod = Quelle der Wahrheit) ----------------------------
const slotSchema = z.enum(['prefix', 'suffix'])
const originSchema = z.enum(['rollable', 'corrupted', 'desecrated', 'essence'])

const modSchema = z.object({
  id: z.string(),
  text: z.string(),
  slot: slotSchema.nullable(),
  origin: originSchema,
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

const essenceModSchema = z.object({
  mod: z.string(),
  ilvl: z.number().int(),
  values: z.array(z.tuple([z.number(), z.number()])),
})
const essencesFileSchema = z.record(z.string(), z.array(essenceModSchema))

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

function parseValues(nvalues: string | null): [number, number][] {
  if (!nvalues) return []
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

  // Herkunft + Slot je Mod aus mgroup (Base=1, Desecrated=10) und affix – fuer
  // die basis-gebundenen Pools (base_mods). Essence (mgroup 13) bleibt hier
  // aussen vor (Gewicht 0, kein base_mods-Eintrag) und laeuft ueber den eigenen
  // Essence-Datenweg; die Mod-Metadaten dazu liefert `metaFor` weiter unten.
  type Classified = { origin: 'rollable' | 'corrupted' | 'desecrated'; slot: 'prefix' | 'suffix' | null }
  const classify = (m: RawModifier): Classified | null => {
    if (m.id_mgroup === '1') {
      if (m.affix === 'prefix' || m.affix === 'suffix')
        return { origin: 'rollable', slot: m.affix }
      if (m.affix === 'corrupted') return { origin: 'corrupted', slot: null }
      return null // socket u. a.
    }
    if (m.id_mgroup === '10' && (m.affix === 'prefix' || m.affix === 'suffix'))
      return { origin: 'desecrated', slot: m.affix }
    return null
  }

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
      if (classify(m) === null) continue
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

    if (rows.length === 0) continue // Basen ohne aufgenommene Mods ueberspringen

    baseModsOut[bid] = rows

    // Item-Typ + Variante nur aus rollbaren Basen ableiten: Basen, die nur ueber
    // Sonder-Herkuenfte Mods haetten, sollen keine neuen Item-Typen erzeugen.
    const hasRollable = rows.some((r) => {
      const rm = modById.get(r.mod)
      return rm ? classify(rm)?.origin === 'rollable' : false
    })
    if (!hasRollable) continue
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

  // ---- Essence: garantierte Mods je Basis --------------------------------
  // Essences setzen einen Mod gezielt (kein Gewicht). Pro Basis werden die
  // Stufen (Lesser/Essence/Greater/…) desselben Mods zu einer Zeile
  // zusammengefasst: kleinste Itemstufe und Wertebereich ueber alle Stufen.
  // Nur Basen, die als Variante eines Item-Typs ausgeliefert werden, kommen
  // in die Ausgabe – so bleibt essences.json auf die sichtbaren Basen begrenzt.
  const variantBases = new Set<string>()
  for (const acc of types.values())
    for (const v of acc.variants) variantBases.add(v.base)

  const essenceModIds = new Set<string>()
  // base -> mod -> gesammelte Stufen-Eintraege
  const essenceAcc = new Map<string, Map<string, { ilvl: number; values: [number, number][] }[]>>()

  for (const ess of data.essences.seq) {
    let byBase: Record<string, { mod: string; ilvl: string }[][]>
    try {
      byBase = JSON.parse(ess.tiers)
    } catch {
      continue
    }
    for (const [bid, groups] of Object.entries(byBase)) {
      if (!variantBases.has(bid)) continue
      for (const group of groups) {
        for (const entry of group) {
          const mid = entry.mod
          const m = modById.get(mid)
          if (!m) continue
          if (m.affix !== 'prefix' && m.affix !== 'suffix') continue
          const ilvl = parseInt(entry.ilvl, 10)
          const rawTier = (data.tiers[mid]?.[bid] ?? []).find(
            (t) => parseInt(t.ilvl, 10) === ilvl,
          )
          const values = parseValues(rawTier?.nvalues ?? null)
          let perMod = essenceAcc.get(bid)
          if (!perMod) {
            perMod = new Map()
            essenceAcc.set(bid, perMod)
          }
          const list = perMod.get(mid) ?? []
          list.push({ ilvl, values })
          perMod.set(mid, list)
          essenceModIds.add(mid)
        }
      }
    }
  }

  // Stufen je (Basis, Mod) zu einer Zeile verdichten.
  const essencesOut: Record<string, { mod: string; ilvl: number; values: [number, number][] }[]> = {}
  for (const [bid, perMod] of essenceAcc) {
    const rows: { mod: string; ilvl: number; values: [number, number][] }[] = []
    for (const [mid, entries] of perMod) {
      const minIlvl = Math.min(...entries.map((e) => e.ilvl))
      const width = Math.max(0, ...entries.map((e) => e.values.length))
      const values: [number, number][] = []
      for (let i = 0; i < width; i++) {
        const pairs = entries.map((e) => e.values[i]).filter(Boolean) as [number, number][]
        if (pairs.length === 0) continue
        const min = Math.min(...pairs.map((p) => p[0]))
        const max = Math.max(...pairs.map((p) => p[1]))
        values.push([min, max])
      }
      rows.push({ mod: mid, ilvl: minIlvl, values })
    }
    rows.sort((a, b) => a.mod.localeCompare(b.mod))
    essencesOut[bid] = rows
  }

  // Herkunft + Slot fuer die Mod-Metadaten: erst die basis-gebundenen Pools,
  // sonst Essence (mgroup 13, prefix/suffix). Nur Essence-exklusive Mods tragen
  // origin 'essence'; Mods, die auch rollbar/Desecrated sind, behalten ihre
  // basis-gebundene Herkunft.
  const metaFor = (m: RawModifier): { origin: 'rollable' | 'corrupted' | 'desecrated' | 'essence'; slot: 'prefix' | 'suffix' | null } | null => {
    const c = classify(m)
    if (c) return c
    if (m.id_mgroup === '13' && (m.affix === 'prefix' || m.affix === 'suffix'))
      return { origin: 'essence', slot: m.affix }
    return null
  }

  // Mods-Metadaten (dedupliziert) fuer alle verwendeten Mods: basis-gebundene
  // plus die per Essence garantierten. Mods ohne aufloesbare Herkunft fallen weg.
  const allModIds = new Set<string>([...usedMods, ...essenceModIds])
  const mods = [...allModIds]
    .map((mid) => {
      const m = modById.get(mid)!
      const meta = metaFor(m)
      if (!meta) return null
      return {
        id: mid,
        text: m.name_modifier,
        slot: meta.slot,
        origin: meta.origin,
        group: groupOf(m),
        tags: tagsOf(m),
      }
    })
    .filter((m): m is NonNullable<typeof m> => m !== null)

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
  const essencesValid = essencesFileSchema.parse(essencesOut)

  const outDir = path.join(OUT_ROOT, VERSION)
  mkdirSync(outDir, { recursive: true })
  writeFileSync(path.join(outDir, 'mods.json'), JSON.stringify(modsValid))
  writeFileSync(path.join(outDir, 'base_mods.json'), JSON.stringify(baseModsValid))
  writeFileSync(path.join(outDir, 'item_types.json'), JSON.stringify(itemTypesValid))
  writeFileSync(path.join(outDir, 'essences.json'), JSON.stringify(essencesValid))

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
  const totalEssence = Object.values(essencesValid).reduce(
    (a, rows) => a + rows.length,
    0,
  )
  console.log(
    `Fertig: ${itemTypesValid.length} Item-Typen, ${
      Object.keys(baseModsValid).length
    } Basen, ${modsValid.length} Mods, ${totalTiers} Tiers, ${
      Object.keys(essencesValid).length
    } Basen mit Essence (${totalEssence} Essence-Zeilen).`,
  )
}

main()
