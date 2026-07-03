import { describe, it, expect } from 'vitest'
import type { ItemType } from '@/data/schema'
import { buildItemGroups, resolveSlug } from '@/lib/itemGroups'

const t = (id: string, name: string): ItemType => ({ id, name, category: id })

describe('buildItemGroups', () => {
  it('gibt Gruppen in Config-Reihenfolge zurueck und leere Gruppen aus', () => {
    const groups = buildItemGroups([
      t('Ring', 'Rings'),
      t('One Hand Axe', 'One Hand Axes'),
      t('Talisman', 'Talismans'),
    ])
    expect(groups.map((g) => g.label)).toEqual([
      'One-Handed Weapons',
      'Jewellery',
      'Other',
    ])
  })

  it('fuehrt jeden bekannten Typ genau einmal', () => {
    const types = [
      t('Ring', 'Rings'),
      t('Amulet', 'Amulets'),
      t('One Hand Axe', 'One Hand Axes'),
      t('Body Armour', 'Body Armours'),
    ]
    const tiles = buildItemGroups(types).flatMap((g) => g.types)
    expect(tiles).toHaveLength(types.length)
    expect(new Set(tiles.map((x) => x.id)).size).toBe(types.length)
  })

  it('leitet Slug und Anzeigenamen ab, Warstaff wird Quarterstaff', () => {
    const [group] = buildItemGroups([t('Warstaff', 'Warstaves')])
    expect(group.label).toBe('Two-Handed Weapons')
    expect(group.types[0].label).toBe('Quarterstaff')
    expect(group.types[0].slug).toBe('warstaves')
  })

  it('setzt hasVariants nur fuer Ruestung/Schild', () => {
    const groups = buildItemGroups([
      t('Body Armour', 'Body Armours'),
      t('Ring', 'Rings'),
    ])
    const all = groups.flatMap((g) => g.types)
    expect(all.find((x) => x.id === 'Body Armour')?.hasVariants).toBe(true)
    expect(all.find((x) => x.id === 'Ring')?.hasVariants).toBe(false)
  })

  it('haengt unbekannte Typen an Other mit Fallback-Icon an', () => {
    const groups = buildItemGroups([
      t('Talisman', 'Talismans'),
      t('Mystery', 'Mysteries'),
    ])
    const other = groups.find((g) => g.label === 'Other')
    expect(other).toBeDefined()
    const mystery = other?.types.find((x) => x.id === 'Mystery')
    expect(mystery?.iconKey).toBe('box')
    expect(mystery?.slug).toBe('mysteries')
  })
})

describe('resolveSlug', () => {
  it('findet den Item-Typ ueber den Slug', () => {
    const types = [t('Body Armour', 'Body Armours'), t('Ring', 'Rings')]
    expect(resolveSlug(types, 'body-armours')?.id).toBe('Body Armour')
    expect(resolveSlug(types, 'unbekannt')).toBeUndefined()
  })
})
