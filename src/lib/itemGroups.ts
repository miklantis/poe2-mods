import type { ItemType } from '@/data/schema'
import { slugify } from '@/lib/slug'

/**
 * Gruppierung der Item-Typen fuer Screen 1. Die Config liefert Reihenfolge,
 * Anzeigenamen (kurz, wie im Design-Handoff) und Icon-Schluessel; welche
 * Item-Typen tatsaechlich existieren, kommt aus den geladenen Daten. Typen,
 * die in keiner Config-Gruppe stehen (z. B. kuenftige neue Typen), werden an
 * die Gruppe "Other" angehaengt, damit nie Daten verschwinden.
 *
 * Der Icon-Schluessel bleibt ein String (kein React-Import), damit dieses
 * Modul DOM-frei und testbar bleibt; die Zuordnung zur Icon-Komponente
 * passiert erst in der UI (`@/lib/icons`).
 */

export interface TileView {
  /** Item-Typ-Id aus den Daten. */
  id: string
  /** Kurzer Anzeigename fuer die Kachel. */
  label: string
  iconKey: string
  /** URL-Slug (aus dem Daten-Namen abgeleitet). */
  slug: string
  /** Zeigt Screen 2 den Basis-Varianten-Selektor (Ruestung/Schild). */
  hasVariants: boolean
}

export interface GroupView {
  label: string
  types: TileView[]
}

interface TypeConfig {
  id: string
  label: string
  iconKey: string
  hasVariants?: boolean
}

interface GroupConfig {
  label: string
  types: TypeConfig[]
}

const OTHER_LABEL = 'Other'

const GROUP_CONFIG: GroupConfig[] = [
  {
    label: 'One-Handed Weapons',
    types: [
      { id: 'One Hand Axe', label: 'Axe', iconKey: 'axe' },
      { id: 'One Hand Mace', label: 'Mace', iconKey: 'gavel' },
      { id: 'One Hand Sword', label: 'Sword', iconKey: 'sword' },
      { id: 'Sceptre', label: 'Sceptre', iconKey: 'wand-sparkles' },
      { id: 'Wand', label: 'Wand', iconKey: 'wand-2' },
      { id: 'Dagger', label: 'Dagger', iconKey: 'pen-tool' },
      { id: 'Claw', label: 'Claw', iconKey: 'grab' },
      { id: 'Spear', label: 'Spear', iconKey: 'navigation' },
      { id: 'Flail', label: 'Flail', iconKey: 'link' },
    ],
  },
  {
    label: 'Two-Handed Weapons',
    types: [
      { id: 'Two Hand Axe', label: 'Two Hand Axe', iconKey: 'axe' },
      { id: 'Two Hand Mace', label: 'Two Hand Mace', iconKey: 'hammer' },
      { id: 'Two Hand Sword', label: 'Two Hand Sword', iconKey: 'swords' },
      { id: 'Warstaff', label: 'Quarterstaff', iconKey: 'grip-vertical' },
      { id: 'Bow', label: 'Bow', iconKey: 'moon' },
      { id: 'Crossbow', label: 'Crossbow', iconKey: 'crosshair' },
      { id: 'Staff', label: 'Staff', iconKey: 'wand' },
    ],
  },
  {
    label: 'Off-Hand',
    types: [
      { id: 'Shield', label: 'Shield', iconKey: 'shield', hasVariants: true },
      { id: 'Buckler', label: 'Buckler', iconKey: 'shield-half' },
      { id: 'Focus', label: 'Focus', iconKey: 'focus' },
      { id: 'Quiver', label: 'Quiver', iconKey: 'feather' },
    ],
  },
  {
    label: 'Armour',
    types: [
      { id: 'Body Armour', label: 'Body Armour', iconKey: 'shirt', hasVariants: true },
      { id: 'Helmet', label: 'Helmet', iconKey: 'hard-hat', hasVariants: true },
      { id: 'Gloves', label: 'Gloves', iconKey: 'hand', hasVariants: true },
      { id: 'Boots', label: 'Boots', iconKey: 'footprints', hasVariants: true },
    ],
  },
  {
    label: 'Jewellery',
    types: [
      { id: 'Ring', label: 'Ring', iconKey: 'circle-dot' },
      { id: 'Amulet', label: 'Amulet', iconKey: 'gem' },
      { id: 'Belt', label: 'Belt', iconKey: 'rectangle-horizontal' },
    ],
  },
  {
    label: OTHER_LABEL,
    types: [
      { id: 'Talisman', label: 'Talisman', iconKey: 'sparkles' },
      { id: 'FishingRod', label: 'Fishing Rod', iconKey: 'fish' },
      { id: 'TrapTool', label: 'Trap Tool', iconKey: 'wrench' },
    ],
  },
]

/**
 * Baut die geordneten Gruppen aus den geladenen Item-Typen. Nur Typen, die in
 * den Daten existieren, erscheinen. Unbekannte Typen landen in "Other".
 */
export function buildItemGroups(itemTypes: readonly ItemType[]): GroupView[] {
  const byId = new Map(itemTypes.map((t) => [t.id, t]))
  const used = new Set<string>()
  const groups: GroupView[] = []

  for (const group of GROUP_CONFIG) {
    const tiles: TileView[] = []
    for (const tc of group.types) {
      const it = byId.get(tc.id)
      if (!it) continue
      used.add(tc.id)
      tiles.push({
        id: it.id,
        label: tc.label,
        iconKey: tc.iconKey,
        slug: slugify(it.name),
        hasVariants: tc.hasVariants ?? false,
      })
    }
    if (tiles.length > 0) groups.push({ label: group.label, types: tiles })
  }

  const rest = itemTypes.filter((t) => !used.has(t.id))
  if (rest.length > 0) {
    const restTiles: TileView[] = rest.map((t) => ({
      id: t.id,
      label: t.name,
      iconKey: 'box',
      slug: slugify(t.name),
      hasVariants: false,
    }))
    const other = groups.find((g) => g.label === OTHER_LABEL)
    if (other) other.types.push(...restTiles)
    else groups.push({ label: OTHER_LABEL, types: restTiles })
  }

  return groups
}

/** Findet den Item-Typ zu einem Slug (fuer Screen 2). */
export function resolveSlug(
  itemTypes: readonly ItemType[],
  slug: string,
): ItemType | undefined {
  return itemTypes.find((t) => slugify(t.name) === slug)
}
