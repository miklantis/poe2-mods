import { describe, it, expect } from 'vitest'
import { displayTags } from './modTags'
import type { Mod } from '@/data/schema.coe'

function mod(tags: string[]): Mod {
  return { id: 'x', text: '', slot: 'prefix', group: 'g', tags }
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
