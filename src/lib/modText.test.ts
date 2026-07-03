import { describe, it, expect } from 'vitest'
import { cleanModText, modFamilyLabel } from './modText'

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
