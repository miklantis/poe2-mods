import { describe, it, expect } from 'vitest'
import { filterResult, availableTags } from './filter'
import type { ModGroup, QueryResult } from './baseEngine'
import type { Mod, Slot } from '@/data/schema.coe'

function mod(text: string, tags: string[]): Mod {
  return { id: text, text, slot: 'prefix', origin: 'rollable', group: text, tags }
}

function group(slot: Slot, name: string, m: Mod): ModGroup {
  return {
    group: name,
    slot,
    weight: 100,
    probability: 0.1,
    mods: [
      {
        mod: m,
        tier: 1,
        tierCount: 1,
        ilvl: 1,
        weight: 100,
        values: [[1, 2]],
        probability: 0.1,
      },
    ],
  }
}

function result(prefixes: ModGroup[], suffixes: ModGroup[]): QueryResult {
  return { prefixes, suffixes, prefixWeightTotal: 0, suffixWeightTotal: 0 }
}

const fire = group('prefix', 'Fire', mod('Adds # to # Fire Damage', ['fire']))
const cold = group('prefix', 'Cold', mod('Adds # to # Cold Damage', ['cold']))
const life = group('suffix', 'Life', mod('# to maximum Life', ['life']))

describe('availableTags', () => {
  it('sammelt Farb-Tags aus Praefixen und Suffixen, sortiert', () => {
    expect(availableTags([cold, fire, life])).toEqual([
      'fire',
      'cold',
      'life',
    ])
  })
})

describe('filterResult – Tags (ODER)', () => {
  it('behaelt Gruppen mit einem der aktiven Tags', () => {
    const r = filterResult(result([fire, cold], [life]), {
      tags: ['fire'],
      search: '',
    })
    expect(r.prefixes.map((g) => g.group)).toEqual(['Fire'])
    expect(r.suffixes).toEqual([])
  })

  it('mehrere Tags verknuepfen mit ODER', () => {
    const r = filterResult(result([fire, cold], [life]), {
      tags: ['fire', 'cold'],
      search: '',
    })
    expect(r.prefixes.map((g) => g.group)).toEqual(['Fire', 'Cold'])
  })

  it('ohne Tags kein Tag-Filter', () => {
    const r = filterResult(result([fire, cold], [life]), {
      tags: [],
      search: '',
    })
    expect(r.prefixes).toHaveLength(2)
  })
})

describe('filterResult – Suche', () => {
  it('findet ueber den Mod-Text', () => {
    const r = filterResult(result([fire, cold], [life]), {
      tags: [],
      search: 'cold',
    })
    expect(r.prefixes.map((g) => g.group)).toEqual(['Cold'])
  })

  it('alle Tokens muessen vorkommen', () => {
    const r = filterResult(result([fire, cold], [life]), {
      tags: [],
      search: 'fire damage',
    })
    expect(r.prefixes.map((g) => g.group)).toEqual(['Fire'])
  })

  it('kombiniert Tag- und Suchfilter', () => {
    const r = filterResult(result([fire, cold], [life]), {
      tags: ['fire', 'cold'],
      search: 'cold',
    })
    expect(r.prefixes.map((g) => g.group)).toEqual(['Cold'])
  })
})
