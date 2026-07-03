import { describe, it, expect } from 'vitest'
import { displayTags } from './modTags'

describe('displayTags', () => {
  it('behaelt nur bekannte Tags, laesst interne Unter-Tags weg', () => {
    expect(
      displayTags(['elemental_resistance', 'fire', 'resistance', 'elemental']),
    ).toEqual(['fire', 'elemental', 'resistance'])
  })

  it('sortiert in fester Reihenfolge (Schadensarten zuerst)', () => {
    expect(displayTags(['resistance', 'cold', 'physical'])).toEqual([
      'physical',
      'cold',
      'resistance',
    ])
  })

  it('behaelt primaere Tags, laesst Sammel-Tag defences weg', () => {
    expect(displayTags(['defences', 'armour'])).toEqual(['armour'])
  })

  it('entfernt Duplikate', () => {
    expect(displayTags(['fire', 'fire'])).toEqual(['fire'])
  })
})
