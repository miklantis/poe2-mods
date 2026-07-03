import { describe, expect, it } from 'vitest'
import type { Mod } from '@/data/schema'
import { effectiveWeight, runQuery } from './engine'

/** Baut einen Test-Mod mit sinnvollen Vorgaben; nur Relevantes wird ueberschrieben. */
function makeMod(partial: Partial<Mod> & Pick<Mod, 'id'>): Mod {
  return {
    id: partial.id,
    name: partial.name ?? partial.id,
    type: partial.type ?? 'Test',
    groups: partial.groups ?? ['GroupA'],
    slot: partial.slot ?? 'prefix',
    requiredLevel: partial.requiredLevel ?? 1,
    stats: partial.stats ?? [],
    text: partial.text ?? partial.id,
    spawnWeights: partial.spawnWeights ?? [{ tag: 'ring', weight: 100 }],
    implicitTags: partial.implicitTags ?? [],
    addsTags: partial.addsTags ?? [],
    isEssenceOnly: partial.isEssenceOnly ?? false,
  }
}

describe('effectiveWeight', () => {
  it('nimmt das Gewicht des ersten passenden Tags', () => {
    const mod = makeMod({
      id: 'm',
      spawnWeights: [
        { tag: 'amulet', weight: 50 },
        { tag: 'ring', weight: 100 },
      ],
    })
    expect(effectiveWeight(mod, ['ring'])).toBe(100)
  })

  it('liefert 0, wenn der erste passende Eintrag Gewicht 0 hat (Abschottung)', () => {
    const mod = makeMod({
      id: 'm',
      spawnWeights: [
        { tag: 'ring', weight: 0 },
        { tag: 'default', weight: 100 },
      ],
    })
    // Das Item hat beide Tags; der erste passende (ring) gewinnt mit 0.
    expect(effectiveWeight(mod, ['ring', 'default'])).toBe(0)
  })

  it('liefert 0, wenn kein Tag passt', () => {
    const mod = makeMod({ id: 'm', spawnWeights: [{ tag: 'amulet', weight: 100 }] })
    expect(effectiveWeight(mod, ['ring'])).toBe(0)
  })
})

describe('runQuery – Eignung', () => {
  it('schliesst Mods ohne passendes Gewicht aus', () => {
    const mods = [
      makeMod({ id: 'ok', spawnWeights: [{ tag: 'ring', weight: 100 }] }),
      makeMod({ id: 'raus', spawnWeights: [{ tag: 'amulet', weight: 100 }] }),
    ]
    const res = runQuery(mods, { tags: ['ring'], itemLevel: 100 })
    const ids = res.prefixes.flatMap((g) => g.mods.map((m) => m.mod.id))
    expect(ids).toEqual(['ok'])
  })
})

describe('runQuery – Tier', () => {
  it('vergibt Tier 1 an das hoechste requiredLevel innerhalb Gruppe plus Slot', () => {
    const mods = [
      makeMod({ id: 't3', groups: ['G'], requiredLevel: 1 }),
      makeMod({ id: 't1', groups: ['G'], requiredLevel: 30 }),
      makeMod({ id: 't2', groups: ['G'], requiredLevel: 15 }),
    ]
    const res = runQuery(mods, { tags: ['ring'], itemLevel: 100 })
    const group = res.prefixes.find((g) => g.group === 'G')
    expect(group?.mods.map((m) => [m.mod.id, m.tier, m.tierCount])).toEqual([
      ['t1', 1, 3],
      ['t2', 2, 3],
      ['t3', 3, 3],
    ])
  })

  it('haelt Tier stabil, auch wenn die Itemstufe hoehere Tiers ausblendet', () => {
    const mods = [
      makeMod({ id: 't1', groups: ['G'], requiredLevel: 60 }),
      makeMod({ id: 't2', groups: ['G'], requiredLevel: 30 }),
      makeMod({ id: 't3', groups: ['G'], requiredLevel: 1 }),
    ]
    const res = runQuery(mods, { tags: ['ring'], itemLevel: 40 })
    const group = res.prefixes.find((g) => g.group === 'G')
    // t1 (req 60) ist ausgeblendet, aber t2 bleibt Tier 2 von 3.
    expect(group?.mods.map((m) => [m.mod.id, m.tier, m.tierCount])).toEqual([
      ['t2', 2, 3],
      ['t3', 3, 3],
    ])
  })

  it('trennt Tier-Leitern nach Slot, auch bei gleicher Gruppe', () => {
    const mods = [
      makeMod({ id: 'p1', groups: ['G'], slot: 'prefix', requiredLevel: 20 }),
      makeMod({ id: 's1', groups: ['G'], slot: 'suffix', requiredLevel: 50 }),
    ]
    const res = runQuery(mods, { tags: ['ring'], itemLevel: 100 })
    expect(res.prefixes[0].mods[0].tier).toBe(1)
    expect(res.prefixes[0].mods[0].tierCount).toBe(1)
    expect(res.suffixes[0].mods[0].tier).toBe(1)
    expect(res.suffixes[0].mods[0].tierCount).toBe(1)
  })
})

describe('runQuery – Itemstufe', () => {
  it('filtert Mods oberhalb der Itemstufe aus dem Pool', () => {
    const mods = [
      makeMod({ id: 'low', requiredLevel: 10 }),
      makeMod({ id: 'high', requiredLevel: 80 }),
    ]
    const res = runQuery(mods, { tags: ['ring'], itemLevel: 50 })
    const ids = res.prefixes.flatMap((g) => g.mods.map((m) => m.mod.id))
    expect(ids).toEqual(['low'])
  })
})

describe('runQuery – Wahrscheinlichkeit', () => {
  it('rechnet pro Slot; die Summe der Wahrscheinlichkeiten ist 1', () => {
    const mods = [
      makeMod({ id: 'a', slot: 'prefix', groups: ['A'], spawnWeights: [{ tag: 'ring', weight: 300 }] }),
      makeMod({ id: 'b', slot: 'prefix', groups: ['B'], spawnWeights: [{ tag: 'ring', weight: 100 }] }),
      makeMod({ id: 'c', slot: 'suffix', groups: ['C'], spawnWeights: [{ tag: 'ring', weight: 50 }] }),
    ]
    const res = runQuery(mods, { tags: ['ring'], itemLevel: 100 })
    expect(res.prefixWeightTotal).toBe(400)
    expect(res.suffixWeightTotal).toBe(50)
    const a = res.prefixes.find((g) => g.group === 'A')?.mods[0]
    const b = res.prefixes.find((g) => g.group === 'B')?.mods[0]
    expect(a?.probability).toBeCloseTo(0.75, 10)
    expect(b?.probability).toBeCloseTo(0.25, 10)
    const prefixSum = res.prefixes.reduce(
      (sum, g) => sum + g.mods.reduce((s, m) => s + m.probability, 0),
      0,
    )
    expect(prefixSum).toBeCloseTo(1, 10)
    const suffixSum = res.suffixes.reduce(
      (sum, g) => sum + g.mods.reduce((s, m) => s + m.probability, 0),
      0,
    )
    expect(suffixSum).toBeCloseTo(1, 10)
  })

  it('rechnet die Wahrscheinlichkeit nur ueber den erreichbaren Pool', () => {
    const mods = [
      makeMod({ id: 'a', slot: 'prefix', groups: ['A'], requiredLevel: 1, spawnWeights: [{ tag: 'ring', weight: 100 }] }),
      makeMod({ id: 'b', slot: 'prefix', groups: ['B'], requiredLevel: 80, spawnWeights: [{ tag: 'ring', weight: 100 }] }),
    ]
    // Bei ilvl 50 faellt b weg; a hat damit 100 % im Slot.
    const res = runQuery(mods, { tags: ['ring'], itemLevel: 50 })
    const a = res.prefixes.find((g) => g.group === 'A')?.mods[0]
    expect(a?.probability).toBeCloseTo(1, 10)
  })
})

describe('runQuery – Gruppen', () => {
  it('fasst Tiers je Gruppe zusammen und summiert Gewicht und Wahrscheinlichkeit', () => {
    const mods = [
      makeMod({ id: 't1', groups: ['G'], requiredLevel: 20, spawnWeights: [{ tag: 'ring', weight: 100 }] }),
      makeMod({ id: 't2', groups: ['G'], requiredLevel: 10, spawnWeights: [{ tag: 'ring', weight: 100 }] }),
      makeMod({ id: 'other', groups: ['H'], requiredLevel: 1, spawnWeights: [{ tag: 'ring', weight: 200 }] }),
    ]
    const res = runQuery(mods, { tags: ['ring'], itemLevel: 100 })
    const g = res.prefixes.find((gr) => gr.group === 'G')
    expect(g?.mods).toHaveLength(2)
    expect(g?.weight).toBe(200)
    expect(g?.probability).toBeCloseTo(0.5, 10)
  })
})
