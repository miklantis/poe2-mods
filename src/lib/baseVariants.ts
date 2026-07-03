import type { BaseItem } from '@/data/schema'

/**
 * Ableitung der Basis-Varianten eines Item-Typs aus den Basis-Items. DOM-frei
 * und testbar.
 *
 * Hintergrund: `runQuery` braucht ein Tag-Set. Manche Item-Typen haben genau
 * eines (z. B. Ringe: immer `ring`, `default`), andere zerfallen in mehrere
 * Pools mit unterschiedlichen rollbaren Mods:
 *  - Ruestung nach Attribut (`str_armour`, `dex_armour`, ...),
 *  - Caster-Waffen mit Spell-Restriktionen (`no_fire_spell_mods`, ...).
 *
 * Vorgehen:
 *  - Nicht-craftbare Spezialbasen (`not_for_sale`, `demigods`) werden
 *    ausgeschlossen, damit keine Phantom-Varianten entstehen.
 *  - Basen werden nach ihren unterscheidenden Tags gruppiert (ohne generisches
 *    Rauschen wie `default`, `runeforged`, `*_basetype`).
 *  - Die kanonischen Tags einer Variante sind der Durchschnitt (die
 *    Schnittmenge) der vollen Tag-Listen ihrer Basen. Das entfernt
 *    basetype-spezifisches Rauschen und liefert den generischen Pool, wie ihn
 *    auch der ModifiersCalc auf poe2db zeigt.
 */

export interface BaseVariant {
  /** Stabile interne Id (aus den unterscheidenden Tags). */
  id: string
  /** Anzeigename fuer den Umschalter. */
  label: string
  /** Kanonische Tags fuer runQuery. */
  tags: string[]
  /** Beispiel-Basis (kleinste/plain Basis der Variante). */
  sampleBase: string
  /** Sortier-Reihenfolge. */
  order: number
}

const EXCLUDED_BASE_TAGS = new Set(['not_for_sale', 'demigods'])
const NOISE_TAGS = new Set(['default', 'runeforged'])

/** Attribut-Label je Armour-/Shield-Attribut-Tag, mit fester Reihenfolge. */
const ATTRIBUTE_LABELS: { tag: string; label: string; order: number }[] = [
  { tag: 'str_armour', label: 'Stärke', order: 0 },
  { tag: 'dex_armour', label: 'Geschicklichkeit', order: 1 },
  { tag: 'int_armour', label: 'Intelligenz', order: 2 },
  { tag: 'str_dex_armour', label: 'Stärke / Geschick', order: 3 },
  { tag: 'str_int_armour', label: 'Stärke / Intelligenz', order: 4 },
  { tag: 'dex_int_armour', label: 'Geschick / Intelligenz', order: 5 },
  { tag: 'str_dex_int_armour', label: 'Alle Attribute', order: 6 },
]

const STANDARD_ORDER = -1

function isBasetypeTag(tag: string): boolean {
  return tag.endsWith('_basetype')
}

function hasSpellRestriction(tags: readonly string[]): boolean {
  return tags.some((t) => t.startsWith('no_') && t.endsWith('_spell_mods'))
}

/** Unterscheidende Tags einer Basis (ohne Rauschen und basetype-Tags). */
function coreTags(tags: readonly string[]): string[] {
  return tags
    .filter((t) => !NOISE_TAGS.has(t) && !isBasetypeTag(t))
    .slice()
    .sort()
}

/** Schnittmenge der vollen Tag-Listen, deterministisch sortiert. */
function intersectTags(bases: readonly BaseItem[]): string[] {
  if (bases.length === 0) return []
  let acc = new Set(bases[0].tags)
  for (const b of bases.slice(1)) {
    const cur = new Set(b.tags)
    acc = new Set([...acc].filter((t) => cur.has(t)))
  }
  return [...acc].sort()
}

/** Repraesentative Basis: die mit den wenigsten Tags (dann alphabetisch). */
function pickSample(bases: readonly BaseItem[]): string {
  return bases
    .slice()
    .sort((a, b) => a.tags.length - b.tags.length || a.name.localeCompare(b.name))[0]
    .name
}

/**
 * Leitet die Varianten eines Item-Typs ab. Gibt immer mindestens eine Variante
 * zurueck, solange Basen existieren.
 */
export function deriveVariants(
  baseItems: readonly BaseItem[],
  itemClass: string,
): BaseVariant[] {
  const all = baseItems.filter((b) => b.itemClass === itemClass)
  const craftable = all.filter(
    (b) => !b.tags.some((t) => EXCLUDED_BASE_TAGS.has(t)),
  )
  const pool = craftable.length > 0 ? craftable : all
  if (pool.length === 0) return []

  // Nach unterscheidenden Tags gruppieren.
  const groups = new Map<string, BaseItem[]>()
  for (const b of pool) {
    const key = coreTags(b.tags).join('|')
    const list = groups.get(key)
    if (list) list.push(b)
    else groups.set(key, [b])
  }

  interface Raw {
    core: string[]
    tags: string[]
    sampleBase: string
    baseCount: number
  }
  const raws: Raw[] = [...groups.values()].map((bases) => {
    const core = coreTags(bases[0].tags)
    const tags = intersectTags(bases)
    return {
      core,
      // Falls die Schnittmenge leer waere, auf die Core-Tags zurueckfallen.
      tags: tags.length > 0 ? tags : core,
      sampleBase: pickSample(bases),
      baseCount: bases.length,
    }
  })

  // Kandidaten fuer "Standard": weder Attribut noch Spell-Restriktion.
  const attrTagSet = new Set(ATTRIBUTE_LABELS.map((a) => a.tag))
  const standardCandidates = raws.filter(
    (r) => !r.core.some((t) => attrTagSet.has(t)) && !hasSpellRestriction(r.core),
  )
  // Der grosse Standard-Pool ist der mit den meisten Basen.
  const standard =
    standardCandidates.length > 0
      ? standardCandidates.reduce((a, b) => (b.baseCount > a.baseCount ? b : a))
      : undefined

  const hasAttr = raws.some((r) => r.core.some((t) => attrTagSet.has(t)))

  const variants: BaseVariant[] = raws.map((r) => {
    const attr = ATTRIBUTE_LABELS.find((a) => r.core.includes(a.tag))
    let label: string
    let order: number
    if (attr) {
      label = attr.label
      order = attr.order
    } else if (r === standard) {
      // Ohne Attribut-Typen (z. B. Caster-Waffen) ist der neutrale Pool der
      // Haupt-Pool und steht vorne; bei Attribut-Typen ist er ein Sonderfall
      // und steht hinter den Attribut-Varianten.
      label = hasAttr ? 'Ohne Attribut' : 'Standard'
      order = hasAttr ? ATTRIBUTE_LABELS.length : STANDARD_ORDER
    } else {
      label = r.sampleBase
      order = ATTRIBUTE_LABELS.length + 1
    }
    return {
      id: r.core.join('_') || 'standard',
      label,
      tags: r.tags,
      sampleBase: r.sampleBase,
      order,
    }
  })

  variants.sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
  return variants
}
