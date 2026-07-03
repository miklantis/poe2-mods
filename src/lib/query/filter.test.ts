import { describe, it, expect } from 'vitest'
import { filterGroups, availableTags } from './filter'
import type { RepoeGroup } from './repoeEngine'

function group(
  id: string,
  slot: 'prefix' | 'suffix' | null,
  text: string,
  tags: string[],
): RepoeGroup {
  return {
    id,
    slot,
    origin: 'rollable',
    text,
    tags,
    tiers: [{ id: `${id}-1`, tier: 1, tierCount: 1, ilvl: 1, name: '', text, values: [[1, 2]] }],
  }
}

const fire = group('fire', 'prefix', 'Adds # to # Fire Damage', ['fire', 'damage'])
const cold = group('cold', 'prefix', 'Adds # to # Cold Damage', ['cold', 'damage'])
const life = group('life', 'suffix', '+# to maximum Life', ['life'])

describe('filterGroups – Tags (ODER)', () => {
  it('behaelt Gruppen mit mindestens einem aktiven Tag', () => {
    const res = filterGroups([fire, cold, life], { tags: ['fire'], search: '' })
    expect(res.map((g) => g.id)).toEqual(['fire'])
  })
  it('ODER ueber mehrere Tags', () => {
    const res = filterGroups([fire, cold, life], { tags: ['fire', 'life'], search: '' })
    expect(res.map((g) => g.id)).toEqual(['fire', 'life'])
  })
  it('ohne aktive Tags kein Tag-Filter', () => {
    const res = filterGroups([fire, cold, life], { tags: [], search: '' })
    expect(res).toHaveLength(3)
  })
})

describe('filterGroups – Suche', () => {
  it('findet ueber das Familien-Label', () => {
    const res = filterGroups([fire, cold, life], { tags: [], search: 'life' })
    expect(res.map((g) => g.id)).toEqual(['life'])
  })
  it('alle Tokens muessen vorkommen', () => {
    const res = filterGroups([fire, cold, life], { tags: [], search: 'fire damage' })
    expect(res.map((g) => g.id)).toEqual(['fire'])
  })
  it('case-insensitiv', () => {
    const res = filterGroups([fire, cold, life], { tags: [], search: 'COLD' })
    expect(res.map((g) => g.id)).toEqual(['cold'])
  })
})

describe('availableTags', () => {
  it('sammelt vorkommende Farb-Tags in fester Reihenfolge', () => {
    expect(availableTags([fire, cold, life])).toEqual(['fire', 'cold', 'damage', 'life'])
  })
})
