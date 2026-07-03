import { describe, it, expect } from 'vitest'
import type { ItemType } from '@/data/schema.coe'
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
  it('gruppiert nach Kategorie in Config-Reihenfolge', () => {
    const groups = buildItemGroups([
      t('ring', 'Ring', 'Jewellery'),
      t('one-hand-axe', 'One Hand Axe', 'One-Handed Weapons'),
      t('ruby', 'Ruby', 'Jewels'),
    ])
    expect(groups.map((g) => g.label)).toEqual([
      'One-Handed Weapons',
      'Jewellery',
      'Jewels',
    ])
  })

  it('sortiert Typen je Kategorie alphabetisch nach Namen', () => {
    const [group] = buildItemGroups([
      t('sapphire', 'Sapphire', 'Jewels'),
      t('emerald', 'Emerald', 'Jewels'),
      t('ruby', 'Ruby', 'Jewels'),
    ])
    expect(group.types.map((x) => x.label)).toEqual([
      'Emerald',
      'Ruby',
      'Sapphire',
    ])
  })

  it('fuehrt jeden Typ genau einmal, Slug ist die Id', () => {
    const types = [
      t('ring', 'Ring', 'Jewellery'),
      t('amulet', 'Amulet', 'Jewellery'),
      t('body-armour', 'Body Armour', 'Body Armours'),
    ]
    const tiles = buildItemGroups(types).flatMap((g) => g.types)
    expect(tiles).toHaveLength(types.length)
    expect(tiles.every((x) => x.slug === x.id)).toBe(true)
  })

  it('setzt hasVariants bei mehr als einer Variante', () => {
    const groups = buildItemGroups([
      t('body-armour', 'Body Armour', 'Body Armours', 6),
      t('ring', 'Ring', 'Jewellery', 1),
    ])
    const all = groups.flatMap((g) => g.types)
    expect(all.find((x) => x.id === 'body-armour')?.hasVariants).toBe(true)
    expect(all.find((x) => x.id === 'ring')?.hasVariants).toBe(false)
  })

  it('ordnet bekannte Icons zu, Unbekanntes faellt auf box', () => {
    const groups = buildItemGroups([
      t('ring', 'Ring', 'Jewellery'),
      t('mystery', 'Mystery', 'Mysteries'),
    ])
    const all = groups.flatMap((g) => g.types)
    expect(all.find((x) => x.id === 'ring')?.iconKey).toBe('circle-dot')
    expect(all.find((x) => x.id === 'mystery')?.iconKey).toBe('box')
  })

  it('haengt unbekannte Kategorien alphabetisch hinten an', () => {
    const groups = buildItemGroups([
      t('mystery', 'Mystery', 'Zeta'),
      t('ring', 'Ring', 'Jewellery'),
      t('other', 'Other', 'Alpha'),
    ])
    expect(groups.map((g) => g.label)).toEqual(['Jewellery', 'Alpha', 'Zeta'])
  })
})

describe('resolveSlug', () => {
  it('findet den Item-Typ ueber die Id', () => {
    const types = [
      t('body-armour', 'Body Armour', 'Body Armours'),
      t('ring', 'Ring', 'Jewellery'),
    ]
    expect(resolveSlug(types, 'body-armour')?.id).toBe('body-armour')
    expect(resolveSlug(types, 'unbekannt')).toBeUndefined()
  })
})
