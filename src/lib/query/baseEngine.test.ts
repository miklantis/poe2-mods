import { describe, expect, it } from 'vitest'
import type { BaseMod, Mod, Tier } from '@/data/schema.coe'
import { runBaseQuery, runFlatQuery, filterRowsByOrigin } from './baseEngine'

/** Baut einen Mod mit sinnvollen Vorgaben; nur Relevantes wird ueberschrieben. */
function makeMod(partial: Partial<Mod> & Pick<Mod, 'id'>): Mod {
  return {
    id: partial.id,
    text: partial.text ?? partial.id,
    slot: partial.slot === undefined ? 'prefix' : partial.slot,
    origin: partial.origin ?? 'rollable',
    group: partial.group ?? 'GroupA',
    tags: partial.tags ?? [],
  }
}

/** Kurzschreibweise fuer einen Tier. */
function tier(ilvl: number, weight: number, values: [number, number][] = [[1, 1]]): Tier {
  return { ilvl, weight, values }
}

/** Baut eine Nachschlage-Map aus Mods. */
function modMap(mods: Mod[]): Map<string, Mod> {
  return new Map(mods.map((m) => [m.id, m]))
}

describe('runBaseQuery – Erreichbarkeit', () => {
  it('schliesst Tiers oberhalb der Itemstufe aus', () => {
    const mods = [makeMod({ id: 'm', group: 'G', slot: 'prefix' })]
    const rows: BaseMod[] = [{ mod: 'm', tiers: [tier(1, 100), tier(50, 100), tier(80, 100)] }]
    const res = runBaseQuery(rows, modMap(mods), { itemLevel: 60 })
    const ilvls = res.prefixes[0].mods.map((c) => c.ilvl).sort((a, b) => a - b)
    expect(ilvls).toEqual([1, 50])
  })

  it('ueberspringt Zeilen mit unbekannter Mod-ID', () => {
    const rows: BaseMod[] = [{ mod: 'fehlt', tiers: [tier(1, 100)] }]
    const res = runBaseQuery(rows, modMap([]), { itemLevel: 100 })
    expect(res.prefixes).toHaveLength(0)
    expect(res.prefixWeightTotal).toBe(0)
  })
})

describe('runBaseQuery – Tier-Nummerierung', () => {
  it('nummeriert nach Itemstufe absteigend, hoechstes ilvl ist Tier 1', () => {
    const mods = [makeMod({ id: 'm', group: 'G', slot: 'prefix' })]
    const rows: BaseMod[] = [{ mod: 'm', tiers: [tier(1, 100), tier(50, 100), tier(80, 100)] }]
    const res = runBaseQuery(rows, modMap(mods), { itemLevel: 100 })
    const byTier = [...res.prefixes[0].mods].sort((a, b) => a.tier - b.tier)
    expect(byTier.map((c) => c.ilvl)).toEqual([80, 50, 1])
  })

  it('haelt tierCount ueber die volle Liste, auch wenn hohe Tiers herausfallen', () => {
    const mods = [makeMod({ id: 'm', group: 'G', slot: 'prefix' })]
    const rows: BaseMod[] = [{ mod: 'm', tiers: [tier(1, 100), tier(50, 100), tier(80, 100)] }]
    const res = runBaseQuery(rows, modMap(mods), { itemLevel: 60 })
    for (const c of res.prefixes[0].mods) expect(c.tierCount).toBe(3)
    // Der erreichbare ilvl-50-Tier ist Rang 2 von 3, nicht 1 von 2.
    const t50 = res.prefixes[0].mods.find((c) => c.ilvl === 50)
    expect(t50?.tier).toBe(2)
  })
})

describe('runBaseQuery – Wahrscheinlichkeit', () => {
  it('rechnet Tier-Chance als Tier-Gewicht / Slot-Pool', () => {
    const mods = [
      makeMod({ id: 'a', group: 'GA', slot: 'prefix' }),
      makeMod({ id: 'b', group: 'GB', slot: 'prefix' }),
    ]
    const rows: BaseMod[] = [
      { mod: 'a', tiers: [tier(1, 300)] },
      { mod: 'b', tiers: [tier(1, 100)] },
    ]
    const res = runBaseQuery(rows, modMap(mods), { itemLevel: 100 })
    expect(res.prefixWeightTotal).toBe(400)
    const ga = res.prefixes.find((g) => g.group === 'a')
    expect(ga?.mods[0].probability).toBeCloseTo(0.75)
    expect(ga?.probability).toBeCloseTo(0.75)
  })

  it('summiert Gruppen-Gewicht ueber die erreichbaren Tiers', () => {
    const mods = [makeMod({ id: 'm', group: 'G', slot: 'prefix' })]
    const rows: BaseMod[] = [{ mod: 'm', tiers: [tier(1, 200), tier(50, 300)] }]
    const res = runBaseQuery(rows, modMap(mods), { itemLevel: 100 })
    expect(res.prefixes[0].weight).toBe(500)
    expect(res.prefixes[0].probability).toBeCloseTo(1)
  })

  it('trennt Praefix- und Suffix-Pool', () => {
    const mods = [
      makeMod({ id: 'p', group: 'GP', slot: 'prefix' }),
      makeMod({ id: 's', group: 'GS', slot: 'suffix' }),
    ]
    const rows: BaseMod[] = [
      { mod: 'p', tiers: [tier(1, 100)] },
      { mod: 's', tiers: [tier(1, 400)] },
    ]
    const res = runBaseQuery(rows, modMap(mods), { itemLevel: 100 })
    expect(res.prefixWeightTotal).toBe(100)
    expect(res.suffixWeightTotal).toBe(400)
    expect(res.prefixes[0].mods[0].probability).toBeCloseTo(1)
    expect(res.suffixes[0].mods[0].probability).toBeCloseTo(1)
  })

  it('liefert Wahrscheinlichkeit 0, wenn der Slot-Pool leer ist', () => {
    const mods = [makeMod({ id: 'm', group: 'G', slot: 'prefix' })]
    const rows: BaseMod[] = [{ mod: 'm', tiers: [tier(80, 100)] }]
    const res = runBaseQuery(rows, modMap(mods), { itemLevel: 10 })
    expect(res.prefixes).toHaveLength(0)
    expect(res.prefixWeightTotal).toBe(0)
  })
})

describe('runBaseQuery – Gruppierung und Sortierung', () => {
  it('buendelt mehrere Tiers eines Mods in eine Gruppe', () => {
    const mods = [makeMod({ id: 'm', group: 'G', slot: 'prefix' })]
    const rows: BaseMod[] = [{ mod: 'm', tiers: [tier(1, 100), tier(50, 100), tier(80, 100)] }]
    const res = runBaseQuery(rows, modMap(mods), { itemLevel: 100 })
    expect(res.prefixes).toHaveLength(1)
    expect(res.prefixes[0].mods).toHaveLength(3)
  })

  it('trennt mehrere Modifier derselben Ausschluss-Gruppe in eigene Zeilen', () => {
    const mods = [
      makeMod({ id: 'a', group: 'Shared', slot: 'prefix' }),
      makeMod({ id: 'b', group: 'Shared', slot: 'prefix' }),
    ]
    const rows: BaseMod[] = [
      { mod: 'a', tiers: [tier(1, 100)] },
      { mod: 'b', tiers: [tier(1, 100)] },
    ]
    const res = runBaseQuery(rows, modMap(mods), { itemLevel: 100 })
    expect(res.prefixes).toHaveLength(2)
    for (const g of res.prefixes) {
      expect(g.weight).toBe(100)
      expect(g.mods).toHaveLength(1)
    }
    expect(res.prefixes.map((g) => g.group).sort()).toEqual(['a', 'b'])
  })

  it('vermischt Tiers gleicher Ausschluss-Gruppe nicht (Regression Spell Skills)', () => {
    // Zwei eigenstaendige Modifier mit identischer Tier-Struktur, aber
    // gleicher Ausschluss-Gruppe: jeder behaelt seine eigenen Tiers.
    const mods = [
      makeMod({ id: 'fire', text: 'Fire Skills', group: 'Gem', slot: 'suffix' }),
      makeMod({ id: 'cold', text: 'Cold Skills', group: 'Gem', slot: 'suffix' }),
    ]
    const rows: BaseMod[] = [
      { mod: 'fire', tiers: [tier(81, 100), tier(55, 100)] },
      { mod: 'cold', tiers: [tier(81, 100), tier(55, 100)] },
    ]
    const res = runBaseQuery(rows, modMap(mods), { itemLevel: 100 })
    expect(res.suffixes).toHaveLength(2)
    for (const g of res.suffixes) expect(g.mods).toHaveLength(2)
  })

  it('sortiert Gruppen nach Gewicht absteigend', () => {
    const mods = [
      makeMod({ id: 'klein', group: 'Klein', slot: 'prefix' }),
      makeMod({ id: 'gross', group: 'Gross', slot: 'prefix' }),
    ]
    const rows: BaseMod[] = [
      { mod: 'klein', tiers: [tier(1, 100)] },
      { mod: 'gross', tiers: [tier(1, 900)] },
    ]
    const res = runBaseQuery(rows, modMap(mods), { itemLevel: 100 })
    expect(res.prefixes.map((g) => g.group)).toEqual(['gross', 'klein'])
  })

  it('sortiert Tiers innerhalb der Gruppe aufsteigend nach Tier', () => {
    const mods = [makeMod({ id: 'm', group: 'G', slot: 'prefix' })]
    const rows: BaseMod[] = [{ mod: 'm', tiers: [tier(1, 100), tier(80, 100), tier(50, 100)] }]
    const res = runBaseQuery(rows, modMap(mods), { itemLevel: 100 })
    expect(res.prefixes[0].mods.map((c) => c.tier)).toEqual([1, 2, 3])
  })
})

describe('runBaseQuery – Rollen-Bereiche', () => {
  it('reicht die values des Tiers durch', () => {
    const mods = [makeMod({ id: 'm', group: 'G', slot: 'prefix' })]
    const rows: BaseMod[] = [{ mod: 'm', tiers: [tier(1, 100, [[5, 5], [8, 12]])] }]
    const res = runBaseQuery(rows, modMap(mods), { itemLevel: 100 })
    expect(res.prefixes[0].mods[0].values).toEqual([[5, 5], [8, 12]])
  })
})

describe('Herkunft-Trennung', () => {
  const mods = [
    makeMod({ id: 'roll', slot: 'prefix', origin: 'rollable' }),
    makeMod({ id: 'cor', slot: null, origin: 'corrupted' }),
    makeMod({ id: 'des', slot: 'suffix', origin: 'desecrated' }),
  ]
  const rows: BaseMod[] = [
    { mod: 'roll', tiers: [tier(1, 100)] },
    { mod: 'cor', tiers: [tier(1, 1)] },
    { mod: 'des', tiers: [tier(65, 1)] },
  ]

  it('runBaseQuery ueberspringt slot-lose (Corrupted) Mods', () => {
    const res = runBaseQuery(rows, modMap(mods), { itemLevel: 100 })
    const ids = [...res.prefixes, ...res.suffixes].flatMap((g) =>
      g.mods.map((m) => m.mod.id),
    )
    expect(ids).not.toContain('cor')
    expect(ids).toContain('roll')
    expect(ids).toContain('des')
  })

  it('filterRowsByOrigin liefert nur Zeilen der gesuchten Herkunft', () => {
    const map = modMap(mods)
    expect(filterRowsByOrigin(rows, map, 'rollable').map((r) => r.mod)).toEqual(['roll'])
    expect(filterRowsByOrigin(rows, map, 'corrupted').map((r) => r.mod)).toEqual(['cor'])
    expect(filterRowsByOrigin(rows, map, 'desecrated').map((r) => r.mod)).toEqual(['des'])
  })

  it('Rollbar-Pool bleibt ungestoert von anderen Herkuenften', () => {
    const map = modMap(mods)
    const rollable = filterRowsByOrigin(rows, map, 'rollable')
    const res = runBaseQuery(rollable, map, { itemLevel: 100 })
    expect(res.prefixWeightTotal).toBe(100)
    expect(res.prefixes[0].mods[0].probability).toBe(1)
  })
})

describe('runFlatQuery – Corrupted (slot-los)', () => {
  it('bildet eine Zeile je Modifier, ohne Chance, respektiert die Itemstufe', () => {
    const mods = [
      makeMod({ id: 'a', slot: null, origin: 'corrupted', group: 'GA', text: 'Alpha' }),
      makeMod({ id: 'b', slot: null, origin: 'corrupted', group: 'GB', text: 'Beta' }),
    ]
    const rows: BaseMod[] = [
      { mod: 'a', tiers: [tier(1, 1), tier(80, 1)] },
      { mod: 'b', tiers: [tier(90, 1)] },
    ]
    const res = runFlatQuery(rows, modMap(mods), { itemLevel: 60 })
    // Beta (ilvl 90) faellt bei Itemstufe 60 heraus.
    expect(res.map((g) => g.group)).toEqual(['a'])
    // Alpha behaelt nur den erreichbaren Tier (ilvl 1); Chance bleibt 0.
    expect(res[0].mods).toHaveLength(1)
    expect(res[0].probability).toBe(0)
    expect(res[0].mods[0].probability).toBe(0)
  })
})
