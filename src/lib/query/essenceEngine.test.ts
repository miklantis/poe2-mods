import { describe, expect, it } from 'vitest'
import type { EssenceMod, Mod } from '@/data/schema.coe'
import { runEssenceQuery } from './essenceEngine'

function makeMod(partial: Partial<Mod> & Pick<Mod, 'id'>): Mod {
  return {
    id: partial.id,
    text: partial.text ?? partial.id,
    slot: partial.slot === undefined ? 'prefix' : partial.slot,
    origin: partial.origin ?? 'essence',
    group: partial.group ?? `G-${partial.id}`,
    tags: partial.tags ?? [],
  }
}

function modMap(mods: Mod[]): Map<string, Mod> {
  return new Map(mods.map((m) => [m.id, m]))
}

describe('runEssenceQuery – Slot-Trennung und Aufloesung', () => {
  it('trennt Praefixe und Suffixe und uebernimmt Bereich und ilvl', () => {
    const mods = [
      makeMod({ id: 'p', slot: 'prefix', text: '# to maximum Life' }),
      makeMod({ id: 's', slot: 'suffix', text: '+#% to Fire Resistance' }),
    ]
    const rows: EssenceMod[] = [
      { mod: 'p', ilvl: 46, values: [[3, 90]] },
      { mod: 's', ilvl: 12, values: [[11, 35]] },
    ]
    const res = runEssenceQuery(rows, modMap(mods), { itemLevel: 100 })
    expect(res.prefixes).toHaveLength(1)
    expect(res.suffixes).toHaveLength(1)
    const pre = res.prefixes[0].mods[0]
    expect(pre.ilvl).toBe(46)
    expect(pre.values).toEqual([[3, 90]])
    expect(pre.probability).toBe(0)
    expect(pre.tier).toBe(1)
  })

  it('liefert je Mod genau eine Zeile', () => {
    const mods = [makeMod({ id: 'p', slot: 'prefix' })]
    const rows: EssenceMod[] = [{ mod: 'p', ilvl: 1, values: [[1, 2]] }]
    const res = runEssenceQuery(rows, modMap(mods), { itemLevel: 100 })
    expect(res.prefixes[0].mods).toHaveLength(1)
  })
})

describe('runEssenceQuery – Filter und Robustheit', () => {
  it('blendet Zeilen oberhalb der Itemstufe aus', () => {
    const mods = [
      makeMod({ id: 'a', slot: 'prefix' }),
      makeMod({ id: 'b', slot: 'prefix' }),
    ]
    const rows: EssenceMod[] = [
      { mod: 'a', ilvl: 20, values: [] },
      { mod: 'b', ilvl: 65, values: [] },
    ]
    const res = runEssenceQuery(rows, modMap(mods), { itemLevel: 30 })
    expect(res.prefixes.map((g) => g.mods[0].mod.id)).toEqual(['a'])
  })

  it('ueberspringt unbekannte Mod-IDs und slot-lose Mods', () => {
    const mods = [makeMod({ id: 'c', slot: null })]
    const rows: EssenceMod[] = [
      { mod: 'fehlt', ilvl: 1, values: [] },
      { mod: 'c', ilvl: 1, values: [] },
    ]
    const res = runEssenceQuery(rows, modMap(mods), { itemLevel: 100 })
    expect(res.prefixes).toHaveLength(0)
    expect(res.suffixes).toHaveLength(0)
  })

  it('sortiert Gruppen je Slot nach Familien-Label', () => {
    const mods = [
      makeMod({ id: 'z', slot: 'prefix', text: 'Zeal aura effect' }),
      makeMod({ id: 'a', slot: 'prefix', text: 'Adds fire damage' }),
    ]
    const rows: EssenceMod[] = [
      { mod: 'z', ilvl: 1, values: [] },
      { mod: 'a', ilvl: 1, values: [] },
    ]
    const res = runEssenceQuery(rows, modMap(mods), { itemLevel: 100 })
    expect(res.prefixes.map((g) => g.mods[0].mod.id)).toEqual(['a', 'z'])
  })
})
