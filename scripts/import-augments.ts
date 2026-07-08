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

/**
 * Text-Aufbereitung mit erhaltener Zeilenstruktur: Link-Markup entfernen, je
 * Zeile den Leerraum normalisieren, leere Zeilen verwerfen und die Zeilen mit
 * `\n` verbinden. Ein Effekt kann mehrere Zeilen haben (ein Sockelbares gibt je
 * Item-Kategorie genau EINEN Modifier, dessen Stat-Zeilen zusammengehoeren –
 * z. B. Nachteil plus Vorteil). Die Kopplung bleibt so erhalten, statt in
 * Einzeleffekte zu zerfallen.
 */
function cleanText(raw: string): string {
  return raw
    .replace(/\[[^\]|]*\|([^\]]+)\]/g, '$1')
    .replace(/\[([^\]]+)\]/g, '$1')
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter((l) => l.length > 0)
    .join('\n')
}
/** Familien-Text: Zahlen/Bereiche zu `#` vereinheitlichen; Zeilen bleiben. */
function familyText(raw: string): string {
  return cleanText(raw)
    .replace(/\((\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)\)/g, '#')
    .replace(/\((\d+(?:\.\d+)?)\)/g, '#')
    .replace(/\b\d+(?:\.\d+)?\b/g, '#')
    .replace(/#+/g, '#')
}
/** Einzeiliger Gruppierungs-/ID-Schluessel (Zeilen zu Leerzeichen). */
function labelKey(raw: string): string {
  return familyText(raw).replace(/\n/g, ' ')
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
 * Verdichtet die Modifier-Texte zu Familien: gruppiert nach einzeiligem
 * Label-Schluessel; ist der (mehrzeilige) Text ueber alle Vorkommen gleich, wird
 * er konkret gezeigt, sonst der Familien-Text mit `#`. Jeder Eingabe-Text ist
 * bereits EIN vollstaendiger Modifier (ggf. mehrzeilig, `\n`-getrennt).
 */
function toEntries(mods: string[]): AugmentEntry[] {
  const fams = new Map<
    string,
    { variants: Set<string>; famText: string }
  >()
  for (const raw of mods) {
    const key = labelKey(raw)
    if (!key) continue
    const fam = fams.get(key) ?? { variants: new Set<string>(), famText: familyText(raw) }
    fam.variants.add(cleanText(raw))
    fams.set(key, fam)
  }
  const out: AugmentEntry[] = []
  for (const [key, { variants, famText }] of fams) {
    const text = variants.size === 1 ? [...variants][0]! : famText
    out.push({ id: key, text, filterTags: deriveFilterTags(key) })
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
        // Alle Stat-Zeilen dieser Kategorie sind EIN Modifier -> zusammenhalten.
        const at = (cv.stat_text ?? []).join('\n')
        if (at.trim()) augTexts.push(at)
        const bt = (cv.bonded_stat_text ?? []).join('\n')
        if (bt.trim()) bonTexts.push(bt)
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
