/**
 * Import-Skript: repoe `augments.json` -> `data/<version>/augments.json`.
 *
 * `augments.json` beschreibt Socketables (Soul Cores, Runen, Talismane) und
 * ihren Effekt je Item-Kategorie. Der Browser zeigt das aber pro Item-TYP, also
 * wird die Datei invertiert: fuer jeden Ausruestungs-Typ werden die passenden
 * Effekte gesammelt und zu Familien verdichtet.
 *
 *  - `augment` = Effekt beim Einsetzen einer Rune/Soul Core (Feld `stat_text`),
 *  - `bonded`  = Effekt ueber einen gebundenen Talisman (Feld `bonded_stat_text`).
 *
 * Zuordnung Item-Typ -> Augment-Kategorie ueber Klassen-Token (siehe
 * TYPE_TOKENS / CAT_TOKENS). Ein Effekt gilt fuer einen Typ, wenn sich die
 * Token seiner Kategorie mit den Token des Typs schneiden. Sonderfall Talisman:
 * er zieht zusaetzlich aus dem Waffen- und Ruestungs-Pool (deckungsgleich mit
 * poe2db).
 *
 * Werte sind fest (kein Tier/keine Itemstufe). Variieren sie zwischen
 * Rune-Stufen, wird die Familie mit `#`-Platzhaltern gezeigt (wie poe2db);
 * ist der Wert ueber alle Vorkommen gleich, bleibt der konkrete Text.
 *
 * Ausfuehren:  npm run import:augments   (nach import:repoe)
 * manifest.json wird nicht angefasst.
 */
import { writeFile, readFile } from 'node:fs/promises'
import path from 'node:path'
import {
  augmentsFileSchema,
  itemTypesFileSchema,
  type AugmentEntry,
} from '../src/data/schema.repoe.ts'

const RAW_BASE = 'https://raw.githubusercontent.com/repoe-fork/poe2/master'
const ROOT = path.resolve(import.meta.dirname, '..')

interface RawCategory {
  stat_text?: string[]
  bonded_stat_text?: string[]
}
interface RawAugment {
  categories?: Record<string, RawCategory>
}

/**
 * Klassen-Token je Item-Typ (unsere item_types-ID). Fehlt eine ID hier, gilt
 * der Typ als Nicht-Ausruestung (kein Augment-/Bonded-Abschnitt).
 * `all` markiert Ausruestung (bekommt die "All Equipment"-Effekte).
 */
const TYPE_TOKENS: Record<string, string[]> = {
  // Martial-Waffen
  Claw: ['martial', 'weapon', 'all'],
  Dagger: ['martial', 'weapon', 'all'],
  'One Hand Axe': ['martial', 'weapon', 'all'],
  'One Hand Sword': ['martial', 'weapon', 'all'],
  'Two Hand Axe': ['martial', 'weapon', 'all'],
  'Two Hand Sword': ['martial', 'weapon', 'all'],
  Flail: ['martial', 'weapon', 'all'],
  FishingRod: ['martial', 'weapon', 'all'],
  TrapTool: ['martial', 'weapon', 'all'],
  'One Hand Mace': ['martial', 'weapon', 'one_hand_mace', 'all'],
  'Two Hand Mace': ['martial', 'weapon', 'two_hand_mace', 'all'],
  Bow: ['martial', 'weapon', 'bow', 'all'],
  Crossbow: ['martial', 'weapon', 'crossbow', 'all'],
  Spear: ['martial', 'weapon', 'spear', 'all'],
  Warstaff: ['martial', 'weapon', 'quarterstaff', 'all'],
  // Caster-Waffen
  Wand: ['caster', 'weapon', 'wand', 'all'],
  Staff: ['caster', 'weapon', 'staff', 'all'],
  Sceptre: ['caster', 'weapon', 'sceptre', 'all'],
  // Ruestung
  'Body Armour': ['armour', 'body', 'all'],
  Helmet: ['armour', 'helmet', 'all'],
  Gloves: ['armour', 'gloves', 'all'],
  Boots: ['armour', 'boots', 'all'],
  // Offhand
  Shield: ['shield', 'all'],
  Buckler: ['buckler', 'all'],
  Focus: ['focus', 'all'],
  // Schmuck (nur "All Equipment")
  Amulet: ['all'],
  Ring: ['all'],
  Belt: ['all'],
  Quiver: ['all'],
  // Sonderfall: Talisman zieht zusaetzlich aus Waffen- und Ruestungs-Pool
  Talisman: ['talisman', 'martial', 'armour', 'weapon', 'all'],
}

/** Token, die eine Augment-Kategorie erfuellen. */
const CAT_TOKENS: Record<string, string[]> = {
  All: ['all'],
  Armour: ['armour'],
  'Martial Weapon': ['martial'],
  'Caster Weapon': ['caster'],
  'Martial Or Caster Weapon': ['weapon'],
  'Martial Weapon Wand or Staff': ['martial', 'wand', 'staff'],
  'Wand or Staff': ['wand', 'staff'],
  Wand: ['wand'],
  Staff: ['staff'],
  Sceptre: ['sceptre'],
  'One Hand Mace': ['one_hand_mace'],
  'Two Hand Mace': ['two_hand_mace'],
  Bow: ['bow'],
  Crossbow: ['crossbow'],
  Spear: ['spear'],
  Quarterstaff: ['quarterstaff'],
  'One Hand Mace or Quarterstaff': ['one_hand_mace', 'quarterstaff'],
  'Quarterstaff or Spear': ['quarterstaff', 'spear'],
  'Crossbow Bow or Spear': ['crossbow', 'bow', 'spear'],
  'Body Armour': ['body'],
  Helmet: ['helmet'],
  Gloves: ['gloves'],
  Boots: ['boots'],
  Shield: ['shield'],
  Buckler: ['buckler'],
  'Shield or Buckler': ['shield', 'buckler'],
  Focus: ['focus'],
  Talisman: ['talisman'],
  'Maces or Talisman': ['one_hand_mace', 'two_hand_mace', 'talisman'],
}

/** Text-Aufbereitung (identisch zur App: Link-Markup entfernen). */
function clean(raw: string): string {
  return raw
    .replace(/\[[^\]|]*\|([^\]]+)\]/g, '$1')
    .replace(/\[([^\]]+)\]/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}
/** Familien-Label: Zahlen/Bereiche zu `#` vereinheitlichen. */
function label(raw: string): string {
  return clean(raw)
    .replace(/\((\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)\)/g, '#')
    .replace(/\((\d+(?:\.\d+)?)\)/g, '#')
    .replace(/\b\d+(?:\.\d+)?\b/g, '#')
    .replace(/#+/g, '#')
}

/** Beschreibende Filter-Tags aus dem Effekt-Text ableiten (COLOR_TAG_ORDER). */
function deriveFilterTags(text: string): string[] {
  const t = text.toLowerCase()
  const tags = new Set<string>()
  const add = (tag: string, hit: boolean) => {
    if (hit) tags.add(tag)
  }
  add('physical', /physical/.test(t))
  add('fire', /fire|ignite|flammab|burn/.test(t))
  add('cold', /cold|freeze|chill/.test(t))
  add('lightning', /lightning|shock/.test(t))
  add('chaos', /chaos/.test(t))
  add('elemental', /elemental/.test(t))
  add('attack', /attack/.test(t))
  add('caster', /spell|cast\b/.test(t))
  add('critical', /critical/.test(t))
  add('speed', /speed/.test(t))
  add('minion', /minion|companion/.test(t))
  add('life', /life|leech/.test(t))
  add('mana', /mana/.test(t))
  add('energy_shield', /energy shield/.test(t))
  add('armour', /armour/.test(t))
  add('evasion', /evasion/.test(t))
  add('resistance', /resistance/.test(t))
  add('ailment', /ailment|bleed|poison|ignite|shock|freeze/.test(t))
  add('attribute', /strength|dexterity|intelligence|attribute/.test(t))
  add('aura', /aura|herald|reservation|presence/.test(t))
  return [...tags].sort()
}

/**
 * Verdichtet rohe Effekt-Texte zu Familien: gruppiert nach Label; ist der Text
 * ueber alle Vorkommen gleich, wird er konkret gezeigt, sonst das Label mit `#`.
 */
function toEntries(texts: string[]): AugmentEntry[] {
  const fams = new Map<string, Set<string>>()
  for (const raw of texts) {
    const lb = label(raw)
    if (!lb) continue
    const set = fams.get(lb) ?? new Set<string>()
    set.add(clean(raw))
    fams.set(lb, set)
  }
  const out: AugmentEntry[] = []
  for (const [lb, variants] of fams) {
    const text = variants.size === 1 ? [...variants][0]! : lb
    out.push({ id: lb, text, filterTags: deriveFilterTags(lb) })
  }
  out.sort((a, b) => a.text.localeCompare(b.text))
  return out
}

async function main(): Promise<void> {
  const version = (
    await fetch(`${RAW_BASE}/version.txt`).then((r) => r.text())
  ).trim()
  console.log(`Export-Version: ${version}`)

  const augments = (await fetch(`${RAW_BASE}/data/augments.json`).then((r) =>
    r.json(),
  )) as Record<string, RawAugment>

  const itemTypes = itemTypesFileSchema.parse(
    JSON.parse(
      await readFile(
        path.join(ROOT, 'data', version, 'item_types.json'),
        'utf8',
      ),
    ),
  )

  const result: Record<string, { augment: AugmentEntry[]; bonded: AugmentEntry[] }> =
    {}

  for (const it of itemTypes) {
    const typeTokens = TYPE_TOKENS[it.id]
    if (!typeTokens) continue // Nicht-Ausruestung: kein Abschnitt
    const tset = new Set(typeTokens)
    const augTexts: string[] = []
    const bonTexts: string[] = []
    for (const aug of Object.values(augments)) {
      for (const [cat, cv] of Object.entries(aug.categories ?? {})) {
        const catTokens = CAT_TOKENS[cat]
        if (!catTokens) continue
        if (!catTokens.some((tok) => tset.has(tok))) continue
        for (const s of cv.stat_text ?? []) augTexts.push(s)
        for (const s of cv.bonded_stat_text ?? []) bonTexts.push(s)
      }
    }
    result[it.id] = { augment: toEntries(augTexts), bonded: toEntries(bonTexts) }
  }

  const parsed = augmentsFileSchema.parse(result)
  const outPath = path.join(ROOT, 'data', version, 'augments.json')
  await writeFile(outPath, JSON.stringify(parsed))
  const types = Object.keys(parsed).length
  const aug = Object.values(parsed).reduce((n, v) => n + v.augment.length, 0)
  const bon = Object.values(parsed).reduce((n, v) => n + v.bonded.length, 0)
  console.log(
    `Geschrieben: ${outPath} (${types} Item-Typen, ${aug} Augment-, ${bon} Bonded-Familien)`,
  )
}

main().catch((e: unknown) => {
  console.error(e)
  process.exit(1)
})
