import { describe, expect, it } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('fasst Klassen zusammen', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('entfernt kollidierende Tailwind-Klassen zugunsten der letzten', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('ignoriert falsy-Werte', () => {
    expect(cn('a', false, undefined, 'b')).toBe('a b')
  })
})
