import type { BaseMod, Mod, Origin, Slot } from '@/data/schema.coe'
import { modFamilyLabel } from '@/lib/modText'

/**
 * Reine, DOM-freie Query-Engine fuer das basis-zentrierte CoE-Schema. Sie
 * errechnet aus den Mod-Zeilen einer Basis (base_mods[basis]) und einer
 * Itemstufe die rollbaren Mods mit Tier und Wahrscheinlichkeit. Kein React,
 * kein Fetch – vollstaendig mit Vitest testbar.
 *
 * Fachliche Regeln:
 * - Anzeige-Einheit: eine Zeile je Modifier (Mod-ID). Modifier, die sich im
 *   Spiel nur eine interne Ausschluss-Gruppe teilen (z.B. Fire/Cold/Lightning
 *   Spell Skills), bleiben getrennte Zeilen mit eigenen Tiers und eigener
 *   Chance – so wie poe2db sie zeigt.
 * - Pool: Jeder Tier eines Mods, dessen Itemstufe erreicht ist (ilvl <=
 *   Itemstufe), ist ein eigener gewichteter Eintrag. Mehrere Tiers desselben
 *   Mods konkurrieren gleichzeitig – so wie im Spiel auch niedrigere Tiers bei
 *   hoher Itemstufe noch rollbar sind. (Gewicht 0 kommt nicht vor; der Import
 *   verwirft solche Tiers bereits.)
 * - Tier: feste Rangfolge je Mod, nach Itemstufe absteigend (hoechstes ilvl ist
 *   Tier 1). Die Rangfolge und tierCount beziehen sich auf die volle Tier-Liste
 *   des Mods und sind damit unabhaengig vom Itemstufen-Filter stabil.
 * - Wahrscheinlichkeit: pro Slot ein eigener Pool aus den erreichbaren Tier-
 *   Gewichten. Chance je Tier = Tier-Gewicht / Slot-Pool; Chance je Zeile =
 *   Summe der erreichbaren Tier-Gewichte des Modifiers / Slot-Pool.
 */

export interface BaseQueryContext {
  /** Eingestellte Itemstufe. Tiers mit hoeherem ilvl fallen aus dem Pool. */
  itemLevel: number
}

export interface ComputedMod {
  /** Mod-Metadaten (Text, Slot, Gruppe, Tags). */
  mod: Mod
  /** Tier innerhalb des Mods; 1 ist das hoechste (groesstes ilvl). */
  tier: number
  /** Anzahl Tiers des Mods insgesamt (volle Liste, vor dem Itemstufen-Filter). */
  tierCount: number
  /** Ab dieser Itemstufe rollbar. */
  ilvl: number
  /** Spawn-Gewicht dieses Tiers. */
  weight: number
  /** Rollen-Bereiche dieses Tiers als [min, max]-Paare. */
  values: [number, number][]
  /** Anteil am Slot-Pool (0..1), gerechnet ueber den erreichbaren Pool. */
  probability: number
}

export interface ModGroup {
  /**
   * Eindeutiger Schluessel der Anzeige-Zeile: die Mod-ID. Eine Zeile
   * entspricht genau einem Modifier (einem Mod-Text), nicht der internen
   * Ausschluss-Gruppe. Dient zugleich als stabiler React-Key.
   */
  group: string
  slot: Slot
  /** Summe der erreichbaren Gewichte dieser Zeile ueber ihre Tiers. */
  weight: number
  /** Anteil der Zeile am Slot-Pool (0..1). */
  probability: number
  /** Tiers des Modifiers, aufsteigend nach Tier sortiert. */
  mods: ComputedMod[]
}

/**
 * Gemeinsamer Nenner fuer die Anzeige: alles, was die Mod-Spalten-Bausteine von
 * einer Gruppe brauchen. `ModGroup` (rollbar/Desecrated) erfuellt ihn ebenso wie
 * die flachen Corrupted-Gruppen aus `runFlatQuery`. Die Farbe/Beschriftung einer
 * Spalte kommt ueber einen Akzent von aussen, nicht aus der Gruppe.
 */
export interface DisplayGroup {
  /** Eindeutiger Schluessel der Anzeige-Zeile: die Mod-ID (auch React-Key). */
  group: string
  probability: number
  mods: ComputedMod[]
}

export interface QueryResult {
  prefixes: ModGroup[]
  suffixes: ModGroup[]
  prefixWeightTotal: number
  suffixWeightTotal: number
}

/** Zwischen-Eintrag: ein erreichbarer Tier eines aufgeloesten Mods. */
interface ReachableTier {
  mod: Mod
  slot: Slot
  tier: number
  tierCount: number
  ilvl: number
  weight: number
  values: [number, number][]
}

function groupKey(mod: Mod, slot: Slot): string {
  // Anzeige-Einheit ist der einzelne Modifier, nicht die interne
  // Ausschluss-Gruppe. Wuerde nach `mod.group` gebuendelt, fielen mehrere
  // eigenstaendige Modifier derselben Ausschluss-Gruppe (z.B. Fire/Cold/
  // Lightning Spell Skills) in eine Zeile und ihre Tiers wuerden vermischt –
  // man saehe scheinbar mehrfach denselben Tier. Die Mod-ID ist je Basis
  // eindeutig; der Slot bleibt als defensiver Namespace.
  return `${mod.id}|${slot}`
}

/**
 * Reine Herkunft-Auswahl: liefert nur die Zeilen, deren Mod die gesuchte
 * Herkunft hat. Trennt die Reiter (rollable/corrupted/desecrated), bevor die
 * Rechen-Engine laeuft – so mischen sich die Pools nie. Zeilen mit unbekannter
 * Mod-ID fallen heraus.
 */
export function filterRowsByOrigin(
  rows: readonly BaseMod[],
  modsById: ReadonlyMap<string, Mod>,
  origin: Origin,
): BaseMod[] {
  return rows.filter((r) => modsById.get(r.mod)?.origin === origin)
}

/**
 * Weist den Tiers eines Mods ihre Tier-Nummer zu (hoechstes ilvl = Tier 1) und
 * liefert die bei der Itemstufe erreichbaren Tiers samt Rang und tierCount.
 * Der Rang wird ueber die volle Tier-Liste vergeben, damit er stabil bleibt,
 * auch wenn hohe Tiers durch die Itemstufe herausfallen.
 */
function reachableTiers(
  mod: Mod,
  slot: Slot,
  tiers: BaseMod['tiers'],
  itemLevel: number,
): ReachableTier[] {
  const ranked = [...tiers]
    .map((t, index) => ({ t, index }))
    .sort((a, b) => b.t.ilvl - a.t.ilvl || a.index - b.index)
  const tierCount = ranked.length
  const out: ReachableTier[] = []
  ranked.forEach(({ t }, i) => {
    if (t.ilvl > itemLevel) return
    out.push({
      mod,
      slot,
      tier: i + 1,
      tierCount,
      ilvl: t.ilvl,
      weight: t.weight,
      values: t.values,
    })
  })
  return out
}

/**
 * Fuehrt die Query fuer eine Basis aus: loest je Zeile den Mod auf, sammelt die
 * erreichbaren Tiers, bildet Slot-Pools und rechnet Wahrscheinlichkeiten. Zeilen
 * mit unbekannter Mod-ID werden uebersprungen (Datenintegritaet ist Sache des
 * Imports/Loaders).
 */
export function runBaseQuery(
  rows: readonly BaseMod[],
  modsById: ReadonlyMap<string, Mod>,
  ctx: BaseQueryContext,
): QueryResult {
  const reachable: ReachableTier[] = []
  for (const row of rows) {
    const mod = modsById.get(row.mod)
    if (!mod) continue
    // Slot-lose Mods (Corrupted) gehoeren nicht in die Praefix/Suffix-Rechnung;
    // sie laufen ueber einen eigenen, flachen Weg.
    if (mod.slot == null) continue
    reachable.push(...reachableTiers(mod, mod.slot, row.tiers, ctx.itemLevel))
  }

  let prefixWeightTotal = 0
  let suffixWeightTotal = 0
  for (const r of reachable) {
    if (r.slot === 'prefix') prefixWeightTotal += r.weight
    else suffixWeightTotal += r.weight
  }

  const groups = new Map<
    string,
    { group: string; slot: Slot; weight: number; mods: ComputedMod[] }
  >()

  for (const r of reachable) {
    const slotTotal = r.slot === 'prefix' ? prefixWeightTotal : suffixWeightTotal
    const computed: ComputedMod = {
      mod: r.mod,
      tier: r.tier,
      tierCount: r.tierCount,
      ilvl: r.ilvl,
      weight: r.weight,
      values: r.values,
      probability: slotTotal > 0 ? r.weight / slotTotal : 0,
    }
    const key = groupKey(r.mod, r.slot)
    const existing = groups.get(key)
    if (existing) {
      existing.weight += r.weight
      existing.mods.push(computed)
    } else {
      groups.set(key, {
        group: r.mod.id,
        slot: r.slot,
        weight: r.weight,
        mods: [computed],
      })
    }
  }

  const prefixes: ModGroup[] = []
  const suffixes: ModGroup[] = []
  for (const g of groups.values()) {
    // Tiers der Zeile nach Tier aufsteigend; stabiler Tiebreak (Itemstufe,
    // dann Mod-ID) fuer deterministische Reihenfolge.
    g.mods.sort(
      (a, b) => a.tier - b.tier || b.ilvl - a.ilvl || a.mod.id.localeCompare(b.mod.id),
    )
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

/**
 * Flache Query fuer slot-lose Herkuenfte (Corrupted): keine Praefix/Suffix-
 * Trennung, keine Wahrscheinlichkeit (probability 0). Loest je Zeile die bei der
 * Itemstufe erreichbaren Tiers auf, gruppiert nach Mod-Group und sortiert die
 * Gruppen nach ihrem Familien-Label. Zeilen mit unbekannter Mod-ID fallen weg.
 */
export function runFlatQuery(
  rows: readonly BaseMod[],
  modsById: ReadonlyMap<string, Mod>,
  ctx: BaseQueryContext,
): DisplayGroup[] {
  const groups = new Map<string, { group: string; mods: ComputedMod[] }>()
  for (const row of rows) {
    const mod = modsById.get(row.mod)
    if (!mod) continue
    // Slot ist hier bedeutungslos; 'prefix' dient nur der Tier-Aufloesung.
    for (const r of reachableTiers(mod, 'prefix', row.tiers, ctx.itemLevel)) {
      const computed: ComputedMod = {
        mod: r.mod,
        tier: r.tier,
        tierCount: r.tierCount,
        ilvl: r.ilvl,
        weight: r.weight,
        values: r.values,
        probability: 0,
      }
      const existing = groups.get(r.mod.id)
      if (existing) existing.mods.push(computed)
      else groups.set(r.mod.id, { group: r.mod.id, mods: [computed] })
    }
  }

  const out: DisplayGroup[] = []
  for (const g of groups.values()) {
    g.mods.sort(
      (a, b) => a.tier - b.tier || b.ilvl - a.ilvl || a.mod.id.localeCompare(b.mod.id),
    )
    out.push({ group: g.group, probability: 0, mods: g.mods })
  }
  out.sort((a, b) => {
    const fa = modFamilyLabel(a.mods[0]?.mod.text ?? a.group)
    const fb = modFamilyLabel(b.mods[0]?.mod.text ?? b.group)
    return fa.localeCompare(fb)
  })
  return out
}
