import { describe, it, expect } from 'vitest'
import { cleanModText, modFamilyLabel, fillModText, formatRoll } from './modText'

describe('cleanModText', () => {
  it('entfernt Link-Markup mit Ziel', () => {
    expect(cleanModText('+(5-8) to [Strength|Strength]')).toBe(
      '+(5-8) to Strength',
    )
  })

  it('entfernt einfaches Klammer-Markup', () => {
    expect(cleanModText('Adds [Cold] Damage')).toBe('Adds Cold Damage')
  })

  it('laesst Text ohne Markup unveraendert', () => {
    expect(cleanModText('+25% to Fire Resistance')).toBe(
      '+25% to Fire Resistance',
    )
  })

  it('behandelt mehrere Links im selben Text', () => {
    expect(cleanModText('[A|x] and [B|y]')).toBe('A and B')
  })
})

describe('modFamilyLabel', () => {
  it('ersetzt Rollen-Bereiche durch #', () => {
    expect(modFamilyLabel('+(5-8) to [Strength|Strength]')).toBe(
      '+# to Strength',
    )
  })

  it('ersetzt einzelne Klammer-Werte durch #', () => {
    expect(modFamilyLabel('Regenerate (3.5) Life per second')).toBe(
      'Regenerate # Life per second',
    )
  })

  it('laesst feste Zahlen ohne Klammer stehen', () => {
    expect(modFamilyLabel('+25% to Fire Resistance')).toBe(
      '+25% to Fire Resistance',
    )
  })
})

describe('formatRoll', () => {
  it('zeigt einen Bereich als (min-max)', () => {
    expect(formatRoll(1, 2)).toBe('(1-2)')
  })

  it('zeigt gleiche Grenzen als einzelne Zahl', () => {
    expect(formatRoll(5, 5)).toBe('5')
  })

  it('kuerzt ueberfluessige Nachkommastellen', () => {
    expect(formatRoll(2.1, 3)).toBe('(2.1-3)')
  })
})

describe('fillModText', () => {
  it('fuellt einen Platzhalter mit dem Rollen-Bereich', () => {
    expect(fillModText('# to maximum Life', [[10, 20]])).toBe(
      '(10-20) to maximum Life',
    )
  })

  it('fuellt mehrere Platzhalter der Reihe nach', () => {
    expect(fillModText('# to # Physical Thorns damage', [[1, 2], [3, 4]])).toBe(
      '(1-2) to (3-4) Physical Thorns damage',
    )
  })

  it('nutzt eine einzelne Zahl bei gleichen Grenzen', () => {
    expect(fillModText('#% increased Cast Speed', [[7, 7]])).toBe(
      '7% increased Cast Speed',
    )
  })

  it('laesst ueberzaehlige Platzhalter stehen', () => {
    expect(fillModText('# to #', [[1, 2]])).toBe('(1-2) to #')
  })
})
