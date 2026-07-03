import type { ItemType } from '@/data/schema.repoe'

/**
 * Gruppierung der Item-Typen fuer Screen 1. Die Struktur kommt aus den Daten:
 * gruppiert wird nach der `category` jedes Item-Typs. Eine schlanke Config gibt
 * nur die Reihenfolge der Kategorien und ein Icon je Typ vor; die Anzeigenamen
 * und die Zugehoerigkeit stammen aus den geladenen Daten. Kategorien, die in
 * der Reihenfolge fehlen (z. B. kuenftige neue), werden hinten alphabetisch
 * angehaengt, damit nie Daten verschwinden.
 *
 * Der Icon-Schluessel bleibt ein String (kein React-Import), damit dieses Modul
 * DOM-frei und testbar bleibt; die Zuordnung zur Icon-Komponente passiert erst
 * in der UI (`@/lib/icons`).
 */

export interface TileView {
  /** Item-Typ-Id aus den Daten (zugleich URL-Slug). */
  id: string
  /** Anzeigename fuer die Kachel. */
  label: string
  iconKey: string
  /** URL-Slug (= Id). */
  slug: string
  /** Zeigt Screen 2 den Basis-Varianten-Selektor (mehr als eine Variante). */
  hasVariants: boolean
}

export interface GroupView {
  label: string
  types: TileView[]
}

/** Reihenfolge der Kategorien, angelehnt an die poe2db-Uebersicht. */
const CATEGORY_ORDER = [
  'One-Handed Weapons',
  'Two-Handed Weapons',
  'Offhands',
  'Body Armours',
  'Helmets',
  'Gloves',
  'Boots',
  'Jewellery',
  'Charms',
  'Flasks',
  'Jewels',
  'Tablets',
  'Waystones',
]

/** Icon je Item-Typ-Id; unbekannte Typen fallen auf ein neutrales Icon. */
const TYPE_ICONS: Record<string, string> = {
  'one-hand-axe': 'axe',
  'one-hand-mace': 'gavel',
  'one-hand-sword': 'sword',
  sceptre: 'wand-sparkles',
  wand: 'wand-2',
  dagger: 'pen-tool',
  claw: 'grab',
  spear: 'navigation',
  flail: 'link',
  'two-hand-axe': 'axe',
  'two-hand-mace': 'hammer',
  'two-hand-sword': 'swords',
  warstaff: 'grip-vertical',
  staff: 'wand',
  bow: 'moon',
  crossbow: 'crosshair',
  talisman: 'sparkles',
  shield: 'shield',
  focus: 'focus',
  quiver: 'feather',
  'body-armour': 'shirt',
  'grasping-mail': 'shirt',
  helmet: 'hard-hat',
  gloves: 'hand',
  boots: 'footprints',
  ring: 'circle-dot',
  amulet: 'gem',
  belt: 'rectangle-horizontal',
  charm: 'sparkles',
  'life-flask': 'flask-conical',
  'mana-flask': 'flask-conical',
  emerald: 'gem',
  ruby: 'gem',
  sapphire: 'gem',
}

/** Tablets und Waystones teilen sich je ein Icon (per Kategorie). */
const CATEGORY_ICONS: Record<string, string> = {
  Tablets: 'square',
  Waystones: 'map',
}

const ORDER_INDEX = new Map<string, number>(
  CATEGORY_ORDER.map((c, i) => [c, i]),
)

function iconFor(itemType: ItemType): string {
  return TYPE_ICONS[itemType.id] ?? CATEGORY_ICONS[itemType.category] ?? 'box'
}

function toTile(itemType: ItemType): TileView {
  return {
    id: itemType.id,
    label: itemType.name,
    iconKey: iconFor(itemType),
    slug: itemType.id,
    hasVariants: itemType.variants.length > 1,
  }
}

/**
 * Baut die geordneten Gruppen aus den geladenen Item-Typen. Gruppiert nach
 * Kategorie, sortiert Kategorien nach der Config (Unbekanntes alphabetisch
 * hinten) und die Typen je Kategorie alphabetisch nach Anzeigename.
 */
export function buildItemGroups(itemTypes: readonly ItemType[]): GroupView[] {
  const byCategory = new Map<string, ItemType[]>()
  for (const t of itemTypes) {
    const list = byCategory.get(t.category)
    if (list) list.push(t)
    else byCategory.set(t.category, [t])
  }

  const categories = [...byCategory.keys()].sort((a, b) => {
    const ia = ORDER_INDEX.get(a)
    const ib = ORDER_INDEX.get(b)
    if (ia !== undefined && ib !== undefined) return ia - ib
    if (ia !== undefined) return -1
    if (ib !== undefined) return 1
    return a.localeCompare(b)
  })

  return categories.map((category) => ({
    label: category,
    types: byCategory
      .get(category)!
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(toTile),
  }))
}

/** Findet den Item-Typ zu einem Slug (fuer Screen 2). Slug ist die Typ-Id. */
export function resolveSlug(
  itemTypes: readonly ItemType[],
  slug: string,
): ItemType | undefined {
  return itemTypes.find((t) => t.id === slug)
}
