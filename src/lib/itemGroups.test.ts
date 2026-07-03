import { describe, it, expect } from 'vitest'
import type { ItemType } from '@/data/schema.repoe'
import { buildItemGroups, resolveSlug } from '@/lib/itemGroups'

const t = (
  id: string,
  name: string,
  category: string,
  variantCount = 1,
): ItemType => ({
  id,
  name,
  category,
  variants: Array.from({ length: variantCount }, (_, i) => ({
    base: `${id}-${i}`,
    label: `V${i}`,
  })),
})

describe('buildItemGroups', () => {
  it('buendelt Klassen ueber die Zuordnung zu Sammelkategorien, in Config-Reihenfolge', () => {
    const groups = buildItemGroups([
      t('Ring', 'Rings', 'Ring'),
      t('One Hand Axe', 'One Hand Axes', 'One Hand Axe'),
      t('Focus', 'Foci', 'Focus'),
    ])
    expect(groups.map((g) => g.label)).toEqual([
      'One-Handed Weapons',
      'Offhands',
      'Jewellery',
    ])
  })

  it('fasst mehrere Klassen einer Gruppe zusammen', () => {
    const groups = buildItemGroups([
      t('Ring', 'Rings', 'Ring'),
      t('Amulet', 'Amulets', 'Amulet'),
      t('Belt', 'Belts', 'Belt'),
    ])
    expect(groups).toHaveLength(1)
    expect(groups[0].label).toBe('Jewellery')
    expect(groups[0].types.map((x) => x.label)).toEqual([
      'Amulets',
      'Belts',
      'Rings',
    ])
  })

  it('fuehrt jeden Typ genau einmal, Slug ist die Id', () => {
    const types = [
      t('Ring', 'Rings', 'Ring'),
      t('Amulet', 'Amulets', 'Amulet'),
      t('Body Armour', 'Body Armours', 'Body Armour'),
    ]
    const tiles = buildItemGroups(types).flatMap((g) => g.types)
    expect(tiles).toHaveLength(types.length)
    expect(tiles.every((x) => x.slug === x.id)).toBe(true)
  })

  it('setzt hasVariants bei mehr als einer Variante', () => {
    const groups = buildItemGroups([
      t('Body Armour', 'Body Armours', 'Body Armour', 6),
      t('Ring', 'Rings', 'Ring', 1),
    ])
    const all = groups.flatMap((g) => g.types)
    expect(all.find((x) => x.id === 'Body Armour')?.hasVariants).toBe(true)
    expect(all.find((x) => x.id === 'Ring')?.hasVariants).toBe(false)
  })

  it('ordnet bekannte Icons je Id zu, Unbekanntes faellt auf box', () => {
    const groups = buildItemGroups([
      t('Ring', 'Rings', 'Ring'),
      t('Mystery', 'Mystery', 'Mystery'),
    ])
    const all = groups.flatMap((g) => g.types)
    expect(all.find((x) => x.id === 'Ring')?.iconKey).toBe('circle-dot')
    expect(all.find((x) => x.id === 'Mystery')?.iconKey).toBe('box')
  })

  it('haengt unbekannte Kategorien alphabetisch hinten an (Fallback auf Roh-category)', () => {
    const groups = buildItemGroups([
      t('Mystery', 'Mystery', 'Zeta'),
      t('Ring', 'Rings', 'Ring'),
      t('Other', 'Other', 'Alpha'),
    ])
    expect(groups.map((g) => g.label)).toEqual(['Jewellery', 'Alpha', 'Zeta'])
  })
})

describe('resolveSlug', () => {
  it('findet den Item-Typ ueber die Id', () => {
    const types = [
      t('Body Armour', 'Body Armours', 'Body Armour'),
      t('Ring', 'Rings', 'Ring'),
    ]
    expect(resolveSlug(types, 'Body Armour')?.id).toBe('Body Armour')
    expect(resolveSlug(types, 'unbekannt')).toBeUndefined()
  })
})
