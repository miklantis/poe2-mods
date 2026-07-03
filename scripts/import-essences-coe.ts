/**
 * Import-Skript: CoE-Essence-Daten -> repoe-Essence-Format.
 *
 * repoe-fork/poe2 fuehrt keine Essence→Mod-Zuordnung (die `generation_type
 * essence`-Eintraege dort sind Monster-Definitionen). Damit der Essence-
 * Abschnitt (Phase 7) unter repoe erhalten bleibt, wird er einmalig aus dem
 * vorhandenen CoE-Snapshot aufbereitet: die CoE-Essence-Eintraege je Basis
 * werden zu einer Liste je repoe-Item-Klasse verdichtet (Bruecke: der
 * CoE-Item-Typname entspricht exakt der repoe-Klassen-ID).
 *
 * Ergebnis: `data/<repoe-version>/essences.json`, selbst-enthaltend (Text,
 * Slot, kleinste Itemstufe, Wertebereich). Quelle bleibt als solche
 * gekennzeichnet.
 *
 * Ausfuehren:  npm run import:essences
 *
 * manifest.json wird nicht angefasst.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import {
  essencesFileSchema,
  itemTypesFileSchema,
  type EssenceEntry,
} from '../src/data/schema.repoe.ts'

const REPOE_VERSION = '4.5.4.3'
const COE_VERSION = '0.5.4'
const ROOT = path.resolve(import.meta.dirname, '..')

interface CoeMod {
  id: string
  text: string
  slot: 'prefix' | 'suffix' | null
}
interface CoeEssenceRow {
  mod: string
  ilvl: number
  values: [number, number][]
}
interface CoeVariant {
  base: string
  label: string
}
interface CoeItemType {
  id: string
  name: string
  variants: CoeVariant[]
}

function readJson<T>(rel: string): T {
  return JSON.parse(readFileSync(path.join(ROOT, rel), 'utf8')) as T
}

/** Elementweise weitester Bereich zweier Wertelisten (min der Mins, max der Maxs). */
function widen(
  a: [number, number][],
  b: [number, number][],
): [number, number][] {
  const len = Math.max(a.length, b.length)
  const out: [number, number][] = []
  for (let i = 0; i < len; i++) {
    const x = a[i]
    const y = b[i]
    if (x && y) out.push([Math.min(x[0], y[0]), Math.max(x[1], y[1])])
    else out.push((x ?? y) as [number, number])
  }
  return out
}

function main(): void {
  const coeMods = new Map(
    readJson<CoeMod[]>(`data/${COE_VERSION}/mods.json`).map((m) => [m.id, m]),
  )
  const coeEss = readJson<Record<string, CoeEssenceRow[]>>(
    `data/${COE_VERSION}/essences.json`,
  )
  const coeItemTypes = readJson<CoeItemType[]>(
    `data/${COE_VERSION}/item_types.json`,
  )
  const repoeTypes = itemTypesFileSchema.parse(
    readJson<unknown>(`data/${REPOE_VERSION}/item_types.json`),
  )
  const repoeClassIds = new Set(repoeTypes.map((t) => t.id))

  // CoE-Basis-ID -> CoE-Item-Typname (== repoe-Klassen-ID).
  const base2class = new Map<string, string>()
  for (const t of coeItemTypes) {
    for (const v of t.variants) base2class.set(v.base, t.name)
  }

  // Je Klasse: Essence-Eintraege, dedupliziert nach Mod-ID (kleinste Itemstufe,
  // weitester Wertebereich).
  const byClass = new Map<string, Map<string, EssenceEntry>>()
  const unmapped = new Set<string>()

  for (const [baseId, rows] of Object.entries(coeEss)) {
    const classId = base2class.get(baseId)
    if (!classId) continue
    if (!repoeClassIds.has(classId)) {
      unmapped.add(classId)
      continue
    }
    let bucket = byClass.get(classId)
    if (!bucket) {
      bucket = new Map()
      byClass.set(classId, bucket)
    }
    for (const row of rows) {
      const mod = coeMods.get(row.mod)
      if (!mod || mod.slot == null) continue
      const existing = bucket.get(row.mod)
      if (existing) {
        existing.ilvl = Math.min(existing.ilvl, row.ilvl)
        existing.values = widen(existing.values, row.values)
      } else {
        bucket.set(row.mod, {
          id: row.mod,
          text: mod.text,
          slot: mod.slot,
          ilvl: row.ilvl,
          values: row.values,
        })
      }
    }
  }

  if (unmapped.size > 0) {
    throw new Error(
      `CoE-Item-Klassen ohne repoe-Entsprechung: ${[...unmapped].join(', ')}`,
    )
  }

  const out: Record<string, EssenceEntry[]> = {}
  for (const [classId, bucket] of byClass) {
    out[classId] = [...bucket.values()]
  }

  essencesFileSchema.parse(out)
  writeFileSync(
    path.join(ROOT, `data/${REPOE_VERSION}/essences.json`),
    JSON.stringify(out),
  )

  const total = Object.values(out).reduce((n, l) => n + l.length, 0)
  console.log('Fertig.')
  console.log(
    `  essences.json: ${Object.keys(out).length} Item-Klassen, ${total} Essence-Eintraege ` +
      `(aus CoE ${COE_VERSION} aufbereitet).`,
  )
}

main()
