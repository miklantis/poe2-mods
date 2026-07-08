import { describe, expect, it } from 'vitest'
import type { Mod, Tier } from '@/data/schema.repoe'
import { essenceGroups, modFitsBase, runRepoeQuery, warpGroups } from './repoeEngine'

/** Kurzschreibweise fuer einen Tier. */
function tier(
  id: string,
  ilvl: number,
  values: [number, number][] = [[1, 1]],
): Tier {
  return { id, ilvl, name: '', text: id, values }
}

/** Baut eine Familie mit sinnvollen Vorgaben; nur Relevantes wird gesetzt. */
function makeMod(partial: Partial<Mod> & Pick<Mod, 'id'>): Mod {
  return {
    id: partial.id,
    text: partial.text ?? partial.id,
    slot: partial.slot === undefined ? 'prefix' : partial.slot,
    origin: partial.origin ?? 'rollable',
    tags: partial.tags ?? ['ring'],
    filterTags: partial.filterTags ?? [],
    tiers: partial.tiers ?? [tier(`${partial.id}-1`, 1)],
  }
}

describe('modFitsBase', () => {
  it('passt, wenn Basis mindestens einen Eignungs-Tag traegt', () => {
    const mod = makeMod({ id: 'm', tags: ['ring', 'amulet'] })
    expect(modFitsBase(mod, new Set(['ring', 'default']))).toBe(true)
  })
  it('passt nicht ohne gemeinsamen Tag', () => {
    const mod = makeMod({ id: 'm', tags: ['amulet'] })
    expect(modFitsBase(mod, new Set(['ring', 'default']))).toBe(false)
  })
})

describe('runRepoeQuery – Auswahl und Erreichbarkeit', () => {
  it('waehlt nur Familien der gesuchten Herkunft', () => {
    const mods = [
      makeMod({ id: 'roll', origin: 'rollable' }),
      makeMod({ id: 'cor', origin: 'corrupted', slot: null }),
    ]
    const res = runRepoeQuery(mods, ['ring'], 'rollable', { itemLevel: 100 })
    expect(res.map((g) => g.id)).toEqual(['roll'])
  })

  it('waehlt nur passende Basen (Tag-Abgleich)', () => {
    const mods = [
      makeMod({ id: 'ring', tags: ['ring'] }),
      makeMod({ id: 'belt', tags: ['belt'] }),
    ]
    const res = runRepoeQuery(mods, ['ring'], 'rollable', { itemLevel: 100 })
    expect(res.map((g) => g.id)).toEqual(['ring'])
  })

  it('schliesst Tiers oberhalb der Itemstufe aus', () => {
    const mods = [
      makeMod({
        id: 'm',
        tiers: [tier('a', 1), tier('b', 50), tier('c', 80)],
      }),
    ]
    const res = runRepoeQuery(mods, ['ring'], 'rollable', { itemLevel: 60 })
    const ilvls = res[0].tiers.map((t) => t.ilvl).sort((x, y) => x - y)
    expect(ilvls).toEqual([1, 50])
  })

  it('vergibt Tier-Rang ueber die volle Liste (Tier 1 = hoechstes ilvl)', () => {
    const mods = [
      makeMod({
        id: 'm',
        tiers: [tier('a', 1), tier('b', 50), tier('c', 80)],
      }),
    ]
    const res = runRepoeQuery(mods, ['ring'], 'rollable', { itemLevel: 60 })
    // Tier 1 (ilvl 80) faellt raus; erreichbar bleiben Tier 2 (50) und Tier 3 (1).
    expect(res[0].tiers.map((t) => t.tier)).toEqual([2, 3])
    expect(res[0].tiers.every((t) => t.tierCount === 3)).toBe(true)
  })

  it('laesst Familien ganz weg, wenn kein Tier erreichbar ist', () => {
    const mods = [makeMod({ id: 'm', tiers: [tier('a', 80)] })]
    const res = runRepoeQuery(mods, ['ring'], 'rollable', { itemLevel: 10 })
    expect(res).toHaveLength(0)
  })

  it('sortiert Zeilen nach Familien-Label', () => {
    const mods = [
      makeMod({ id: 'z', text: '+# to Zeal' }),
      makeMod({ id: 'a', text: '+# to Armour' }),
    ]
    const res = runRepoeQuery(mods, ['ring'], 'rollable', { itemLevel: 100 })
    expect(res.map((g) => g.id)).toEqual(['a', 'z'])
  })

  it('behaelt slot-lose Herkuenfte (Corrupted) am Stueck', () => {
    const mods = [
      makeMod({ id: 'c1', origin: 'corrupted', slot: null }),
      makeMod({ id: 'c2', origin: 'corrupted', slot: null }),
    ]
    const res = runRepoeQuery(mods, ['ring'], 'corrupted', { itemLevel: 100 })
    expect(res).toHaveLength(2)
    expect(res.every((g) => g.slot === null)).toBe(true)
  })
})

describe('essenceGroups', () => {
  const entries = [
    { id: 'e2', text: '+# to Zeal', slot: 'suffix' as const, ilvl: 20, values: [[1, 5]] as [number, number][], filterTags: [] },
    { id: 'e1', text: '+# to Armour', slot: 'prefix' as const, ilvl: 5, values: [[10, 20]] as [number, number][], filterTags: ['armour', 'defences'] },
  ]

  it('macht je Eintrag eine Zeile mit genau einem Tier', () => {
    const res = essenceGroups(entries, { itemLevel: 100 })
    expect(res).toHaveLength(2)
    expect(res.every((g) => g.tiers.length === 1 && g.origin === 'essence')).toBe(true)
  })

  it('reicht die filterTags des Eintrags durch', () => {
    const res = essenceGroups(entries, { itemLevel: 100 })
    const armour = res.find((g) => g.id === 'e1')
    expect(armour?.filterTags).toEqual(['armour', 'defences'])
  })

  it('filtert nach Itemstufe', () => {
    const res = essenceGroups(entries, { itemLevel: 10 })
    expect(res.map((g) => g.id)).toEqual(['e1'])
  })

  it('sortiert nach Familien-Label', () => {
    const res = essenceGroups(entries, { itemLevel: 100 })
    expect(res.map((g) => g.id)).toEqual(['e1', 'e2'])
  })
})

describe('warpGroups – Warp-Runen nach Slot-Thema', () => {
  it('waehlt nur warp-Familien der erlaubten Themen', () => {
    const mods = [
      makeMod({ id: 'roll', origin: 'rollable', tags: ['ring'] }),
      makeMod({
        id: 'w1',
        origin: 'warp',
        slot: 'prefix',
        tags: ['destruction'],
      }),
      makeMod({
        id: 'w2',
        origin: 'warp',
        slot: 'suffix',
        tags: ['berserking'],
      }),
    ]
    const res = warpGroups(mods, ['destruction'], { itemLevel: 100 })
    expect(res.map((g) => g.id)).toEqual(['w1'])
    expect(res.every((g) => g.origin === 'warp')).toBe(true)
  })

  it('ohne erlaubte Themen kommt nichts', () => {
    const mods = [
      makeMod({ id: 'w', origin: 'warp', slot: 'prefix', tags: ['soul'] }),
    ]
    expect(warpGroups(mods, [], { itemLevel: 100 })).toHaveLength(0)
  })

  it('respektiert die Itemstufe (hohe Tiers fallen heraus)', () => {
    const mods = [
      makeMod({
        id: 'w',
        origin: 'warp',
        slot: 'prefix',
        tags: ['destruction'],
        tiers: [tier('w-1', 65)],
      }),
    ]
    expect(warpGroups(mods, ['destruction'], { itemLevel: 60 })).toHaveLength(0)
    expect(warpGroups(mods, ['destruction'], { itemLevel: 65 })).toHaveLength(1)
  })
})
