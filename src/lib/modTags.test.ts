import { describe, it, expect } from 'vitest'
import { displayTags } from './modTags'
import type { Mod } from '@/data/schema'

function mod(implicitTags: string[]): Mod {
  return {
    id: 'x',
    name: 'x',
    type: 'x',
    groups: [],
    slot: 'prefix',
    requiredLevel: 1,
    stats: [],
    text: '',
    spawnWeights: [],
    implicitTags,
    addsTags: [],
    isEssenceOnly: false,
  }
}

describe('displayTags', () => {
  it('behaelt nur Farb-Tags', () => {
    expect(
      displayTags(mod(['elemental_resistance', 'fire', 'resistance', 'elemental'])),
    ).toEqual(['fire', 'resistance'])
  })

  it('sortiert in fester Reihenfolge (Schadensarten zuerst)', () => {
    expect(displayTags(mod(['resistance', 'cold', 'physical']))).toEqual([
      'physical',
      'cold',
      'resistance',
    ])
  })

  it('liefert leeres Array ohne Farb-Tag', () => {
    expect(displayTags(mod(['defences', 'armour']))).toEqual([])
  })

  it('entfernt Duplikate', () => {
    expect(displayTags(mod(['fire', 'fire']))).toEqual(['fire'])
  })
})
