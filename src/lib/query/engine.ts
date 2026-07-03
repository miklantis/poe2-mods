import type { Mod, Slot } from '@/data/schema'

/**
 * Reine, DOM-freie Query-Engine. Sie errechnet aus dem Mod-Pool und einem
 * Kontext (Item-Tags + Itemstufe) die spawn-baren Mods mit Tier und
 * Wahrscheinlichkeit. Kein React, kein Fetch – vollstaendig mit Vitest testbar.
 *
 * Fachliche Regeln:
 * - Eignung: Die spawnWeights eines Mods werden in Reihenfolge durchlaufen; der
 *   erste Eintrag, dessen Tag das Item hat, liefert das Gewicht. Gewicht 0 oder
 *   kein Treffer bedeutet: der Mod kann nicht spawnen ("erster passender Tag
 *   gewinnt").
 * - Tier: feste Rangfolge innerhalb einer Gruppe plus Slot, nach requiredLevel
 *   absteigend (hoechstes benoetigtes Level ist Tier 1). Die Rangfolge wird ueber
 *   den vollen tag-erreichbaren Pool gebildet und ist damit unabhaengig vom
 *   Itemstufen-Filter stabil.
 * - Wahrscheinlichkeit: pro Slot ein eigener Pool. Sie rechnet nur ueber den bei
 *   der eingestellten Itemstufe erreichbaren Teil des Pools.
 */

export interface QueryContext {
  /** Tag-Set des Item-Sets, z. B. ["ring", "default"]. */
  tags: readonly string[]
  /** Eingestellte Itemstufe. Mods mit hoeherem requiredLevel fallen aus dem Pool. */
  itemLevel: number
}

export interface ComputedMod {
  mod: Mod
  /** Effektives Spawn-Gewicht fuer dieses Item-Set. */
  weight: number
  /** Tier innerhalb der Gruppe plus Slot; 1 ist das hoechste. */
  tier: number
  /** Anzahl Tiers der Gruppe plus Slot im vollen tag-erreichbaren Pool. */
  tierCount: number
  /** Anteil am Slot-Pool (0..1), gerechnet ueber den erreichbaren Pool. */
  probability: number
}

export interface ModGroup {
  group: string
  slot: Slot
  /** Summe der erreichbaren Gewichte dieser Gruppe. */
  weight: number
  /** Anteil der Gruppe am Slot-Pool (0..1). */
  probability: number
  /** Tiers der Gruppe, aufsteigend nach Tier sortiert. */
  mods: ComputedMod[]
}

export interface QueryResult {
  prefixes: ModGroup[]
  suffixes: ModGroup[]
  prefixWeightTotal: number
  suffixWeightTotal: number
}

/**
 * Effektives Spawn-Gewicht nach der Regel "erster passender Tag gewinnt".
 * Liefert 0, wenn kein Tag passt oder der erste passende Eintrag Gewicht 0 hat.
 */
export function effectiveWeight(mod: Mod, tags: Iterable<string>): number {
  const tagSet = tags instanceof Set ? (tags as Set<string>) : new Set(tags)
  for (const sw of mod.spawnWeights) {
    if (tagSet.has(sw.tag)) return sw.weight
  }
  return 0
}

interface EligibleEntry {
  mod: Mod
  weight: number
  index: number
}

function groupKey(mod: Mod): string {
  return `${mod.groups[0]}|${mod.slot}`
}

/**
 * Weist jedem Mod Tier und Tier-Anzahl zu, gruppiert nach Gruppe plus Slot,
 * sortiert nach requiredLevel absteigend (stabiler Tiebreak ueber die
 * Ausgangsreihenfolge).
 */
function assignTiers(
  eligible: readonly EligibleEntry[],
): Map<string, { tier: number; tierCount: number }> {
  const buckets = new Map<string, EligibleEntry[]>()
  for (const entry of eligible) {
    const key = groupKey(entry.mod)
    const bucket = buckets.get(key)
    if (bucket) bucket.push(entry)
    else buckets.set(key, [entry])
  }

  const tiers = new Map<string, { tier: number; tierCount: number }>()
  for (const members of buckets.values()) {
    const sorted = [...members].sort(
      (a, b) => b.mod.requiredLevel - a.mod.requiredLevel || a.index - b.index,
    )
    sorted.forEach((entry, i) => {
      tiers.set(entry.mod.id, { tier: i + 1, tierCount: sorted.length })
    })
  }
  return tiers
}

/**
 * Fuehrt die Query aus: Eignung nach Tags, Tier ueber den vollen tag-Pool,
 * dann Filter nach Itemstufe und Wahrscheinlichkeit pro Slot.
 */
export function runQuery(mods: readonly Mod[], ctx: QueryContext): QueryResult {
  const tagSet = new Set(ctx.tags)

  const eligible: EligibleEntry[] = []
  mods.forEach((mod, index) => {
    const weight = effectiveWeight(mod, tagSet)
    if (weight > 0) eligible.push({ mod, weight, index })
  })

  const tiers = assignTiers(eligible)

  const reachable = eligible.filter((e) => e.mod.requiredLevel <= ctx.itemLevel)

  let prefixWeightTotal = 0
  let suffixWeightTotal = 0
  for (const e of reachable) {
    if (e.mod.slot === 'prefix') prefixWeightTotal += e.weight
    else suffixWeightTotal += e.weight
  }

  const groups = new Map<
    string,
    { group: string; slot: Slot; weight: number; mods: ComputedMod[] }
  >()

  for (const e of reachable) {
    const tier = tiers.get(e.mod.id)
    if (!tier) continue
    const slotTotal = e.mod.slot === 'prefix' ? prefixWeightTotal : suffixWeightTotal
    const computed: ComputedMod = {
      mod: e.mod,
      weight: e.weight,
      tier: tier.tier,
      tierCount: tier.tierCount,
      probability: slotTotal > 0 ? e.weight / slotTotal : 0,
    }
    const key = groupKey(e.mod)
    const existing = groups.get(key)
    if (existing) {
      existing.weight += e.weight
      existing.mods.push(computed)
    } else {
      groups.set(key, {
        group: e.mod.groups[0],
        slot: e.mod.slot,
        weight: e.weight,
        mods: [computed],
      })
    }
  }

  const prefixes: ModGroup[] = []
  const suffixes: ModGroup[] = []
  for (const g of groups.values()) {
    g.mods.sort((a, b) => a.tier - b.tier)
    const slotTotal = g.slot === 'prefix' ? prefixWeightTotal : suffixWeightTotal
    const modGroup: ModGroup = {
      group: g.group,
      slot: g.slot,
      weight: g.weight,
      probability: slotTotal > 0 ? g.weight / slotTotal : 0,
      mods: g.mods,
    }
    if (g.slot === 'prefix') prefixes.push(modGroup)
    else suffixes.push(modGroup)
  }

  const sortGroups = (a: ModGroup, b: ModGroup): number =>
    b.weight - a.weight || a.group.localeCompare(b.group)
  prefixes.sort(sortGroups)
  suffixes.sort(sortGroups)

  return { prefixes, suffixes, prefixWeightTotal, suffixWeightTotal }
}
