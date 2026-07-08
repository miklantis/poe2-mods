import type { ItemType } from '@/data/schema.repoe'

/**
 * Gruppierung der Item-Typen fuer Screen 1. Die Item-Typen kommen aus den Daten;
 * fuer die Uebersicht werden sie ueber eine Zuordnung (Klassen-ID -> Kategorie)
 * zu Sammelgruppen gebuendelt. Eine schlanke Config gibt die Reihenfolge der
 * Kategorien und ein Icon je Typ vor. Kategorien, die in der Reihenfolge fehlen,
 * werden hinten alphabetisch angehaengt; unbekannte IDs fallen auf ihre
 * Roh-`category` zurueck, damit nie Daten verschwinden.
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
  'Ausrüstung',
  'Jewels',
  'Flasks',
  'Relics',
  'Tablets',
  'Waystones',
  'Tools',
]

/**
 * Zuordnung der repoe-Klassen-ID zur angezeigten Sammelkategorie. Die Daten
 * fuehren jede Klasse als eigene `category`; fuer die Uebersicht fassen wir sie
 * hier zu Gruppen zusammen (angelehnt an poe2db). Unbekannte IDs fallen in
 * `buildItemGroups` auf ihre Roh-`category` zurueck, damit nie etwas verschwindet.
 */
const CATEGORY_OF: Record<string, string> = {
  Claw: 'One-Handed Weapons',
  Dagger: 'One-Handed Weapons',
  'One Hand Axe': 'One-Handed Weapons',
  'One Hand Mace': 'One-Handed Weapons',
  'One Hand Sword': 'One-Handed Weapons',
  Sceptre: 'One-Handed Weapons',
  Spear: 'One-Handed Weapons',
  Flail: 'One-Handed Weapons',
  Wand: 'One-Handed Weapons',
  Bow: 'Two-Handed Weapons',
  Crossbow: 'Two-Handed Weapons',
  Staff: 'Two-Handed Weapons',
  Warstaff: 'Two-Handed Weapons',
  'Two Hand Axe': 'Two-Handed Weapons',
  'Two Hand Mace': 'Two-Handed Weapons',
  'Two Hand Sword': 'Two-Handed Weapons',
  FishingRod: 'Two-Handed Weapons',
  Buckler: 'Offhands',
  Focus: 'Offhands',
  Quiver: 'Offhands',
  Shield: 'Offhands',
  'Body Armour': 'Ausrüstung',
  Helmet: 'Ausrüstung',
  Gloves: 'Ausrüstung',
  Boots: 'Ausrüstung',
  Amulet: 'Ausrüstung',
  Belt: 'Ausrüstung',
  Ring: 'Ausrüstung',
  Talisman: 'Ausrüstung',
  Jewel: 'Jewels',
  LifeFlask: 'Flasks',
  ManaFlask: 'Flasks',
  UtilityFlask: 'Flasks',
  Relic: 'Relics',
  TowerAugmentation: 'Tablets',
  Map: 'Waystones',
  TrapTool: 'Tools',
}

/** Icon je repoe-Klassen-ID; unbekannte Typen fallen auf ein neutrales Icon. */
const TYPE_ICONS: Record<string, string> = {
  'One Hand Axe': 'axe',
  'One Hand Mace': 'gavel',
  'One Hand Sword': 'sword',
  Sceptre: 'wand-sparkles',
  Wand: 'wand-2',
  Dagger: 'pen-tool',
  Claw: 'grab',
  Spear: 'navigation',
  Flail: 'link',
  'Two Hand Axe': 'axe',
  'Two Hand Mace': 'hammer',
  'Two Hand Sword': 'swords',
  Warstaff: 'grip-vertical',
  Staff: 'wand',
  Bow: 'moon',
  Crossbow: 'crosshair',
  FishingRod: 'fish',
  Talisman: 'sparkles',
  Shield: 'shield',
  Buckler: 'shield-half',
  Focus: 'focus',
  Quiver: 'feather',
  'Body Armour': 'shirt',
  Helmet: 'hard-hat',
  Gloves: 'hand',
  Boots: 'footprints',
  Ring: 'circle-dot',
  Amulet: 'gem',
  Belt: 'rectangle-horizontal',
  Jewel: 'diamond',
  LifeFlask: 'flask-round',
  ManaFlask: 'flask-conical',
  UtilityFlask: 'pill',
  Relic: 'landmark',
  TowerAugmentation: 'scroll',
  Map: 'map',
  TrapTool: 'wrench',
}

/** Fallback-Icon je Sammelkategorie, falls die ID kein eigenes Icon hat. */
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
    const category = CATEGORY_OF[t.id] ?? t.category
    const list = byCategory.get(category)
    if (list) list.push(t)
    else byCategory.set(category, [t])
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
