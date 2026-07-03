import { describe, it, expect } from 'vitest'
import { displayTags } from './modTags'
import type { Mod } from '@/data/schema.coe'

function mod(tags: string[]): Mod {
  return { id: 'x', text: '', slot: 'prefix', origin: 'rollable', group: 'g', tags }
}

describe('displayTags', () => {
  it('behaelt nur bekannte Tags, laesst interne Unter-Tags weg', () => {
    expect(
      displayTags(mod(['elemental_resistance', 'fire', 'resistance', 'elemental'])),
    ).toEqual(['fire', 'elemental', 'resistance'])
  })

  it('sortiert in fester Reihenfolge (Schadensarten zuerst)', () => {
    expect(displayTags(mod(['resistance', 'cold', 'physical']))).toEqual([
      'physical',
      'cold',
      'resistance',
    ])
  })

  it('behaelt primaere Tags, laesst Sammel-Tag defences weg', () => {
    expect(displayTags(mod(['defences', 'armour']))).toEqual(['armour'])
  })

  it('entfernt Duplikate', () => {
    expect(displayTags(mod(['fire', 'fire']))).toEqual(['fire'])
  })
})
