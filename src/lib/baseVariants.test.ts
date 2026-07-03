import { describe, it, expect } from 'vitest'
import { deriveVariants } from './baseVariants'
import type { BaseItem } from '@/data/schema'

function base(
  name: string,
  itemClass: string,
  tags: string[],
): BaseItem {
  return {
    id: name,
    name,
    itemClass,
    tags,
    dropLevel: 1,
    implicits: [],
    requirements: null,
  }
}

describe('deriveVariants', () => {
  it('liefert eine einzige Variante fuer einfache Typen (Ring)', () => {
    const items = [
      base('Iron Ring', 'Ring', ['ring', 'default']),
      base('Ruby Ring', 'Ring', ['ring', 'default']),
    ]
    const v = deriveVariants(items, 'Ring')
    expect(v).toHaveLength(1)
    expect(v[0].tags).toEqual(['default', 'ring'])
  })

  it('trennt Ruestung nach Attribut und labelt sie', () => {
    const items = [
      base('Rusted Cuirass', 'Body Armour', [
        'str_armour',
        'ezomyte_basetype',
        'body_armour',
        'armour',
        'default',
      ]),
      base('Colosseum Plate', 'Body Armour', [
        'str_armour',
        'body_armour',
        'armour',
        'default',
      ]),
      base('Leather Vest', 'Body Armour', [
        'dex_armour',
        'body_armour',
        'armour',
        'default',
      ]),
    ]
    const v = deriveVariants(items, 'Body Armour')
    expect(v.map((x) => x.label)).toEqual(['Stärke', 'Geschicklichkeit'])
    // Schnittmenge entfernt das basetype-Rauschen.
    const str = v.find((x) => x.label === 'Stärke')!
    expect(str.tags).toEqual(['armour', 'body_armour', 'default', 'str_armour'])
  })

  it('schliesst nicht-craftbare Spezialbasen aus', () => {
    const items = [
      base('Shortsword', 'One Hand Sword', [
        'sword',
        'onehand',
        'one_hand_weapon',
        'weapon',
      ]),
      base('Golden Blade', 'One Hand Sword', [
        'sword',
        'onehand',
        'one_hand_weapon',
        'weapon',
        'demigods',
        'not_for_sale',
      ]),
    ]
    const v = deriveVariants(items, 'One Hand Sword')
    expect(v).toHaveLength(1)
    expect(v[0].label).toBe('Standard')
  })

  it('labelt den groessten neutralen Pool als Standard, Rest per Basisname', () => {
    const items = [
      base('Attuned Wand', 'Wand', ['wand', 'onehand']),
      base('Siphoning Wand', 'Wand', ['wand', 'onehand']),
      base('Bone Wand', 'Wand', [
        'wand',
        'onehand',
        'no_fire_spell_mods',
        'no_cold_spell_mods',
        'no_lightning_spell_mods',
        'no_chaos_spell_mods',
      ]),
    ]
    const v = deriveVariants(items, 'Wand')
    expect(v[0].label).toBe('Standard')
    expect(v.map((x) => x.label)).toContain('Bone Wand')
  })

  it('liefert leeres Array ohne passende Basen', () => {
    expect(deriveVariants([], 'Ring')).toEqual([])
  })
})
