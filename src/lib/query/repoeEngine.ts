import type { EssenceEntry, Mod, Origin, Slot } from '@/data/schema.repoe'
import { modFamilyLabel } from '@/lib/modText'

/**
 * Reine, DOM-freie Query-Engine fuer das mod-zentrierte repoe-Schema. Sie
 * waehlt aus allen Modifiern die, deren Herkunft passt und deren Eignungs-Tags
 * die Basis traegt, und loest je Modifier die bei der Itemstufe erreichbaren
 * Tiers auf. Kein React, kein Fetch – vollstaendig mit Vitest testbar.
 *
 * repoe legt nur binaere Spawn-Gewichte offen (0/1); es gibt daher keine
 * Gewichte und keine Wahrscheinlichkeit. Alle Herkuenfte laufen ueber dieselbe
 * flache Logik: eine Zeile je Modifier-Familie mit ihren erreichbaren Tiers,
 * sortiert nach Familien-Label. Praefix/Suffix ergibt sich aus `group.slot`
 * (die aufrufende Ansicht trennt danach); Corrupted und Essence haben `slot`
 * null und werden am Stueck gezeigt.
 *
 * Fachliche Regeln:
 * - Eignung: eine Familie passt auf eine Basis, wenn die Basis mindestens einen
 *   der Eignungs-Tags der Familie traegt (Basis-Tags gegen `mod.tags`).
 * - Tier: feste Rangfolge je Familie, nach Itemstufe absteigend (hoechstes ilvl
 *   ist Tier 1). Die Rangfolge und `tierCount` beziehen sich auf die volle
 *   Tier-Liste und bleiben unabhaengig vom Itemstufen-Filter stabil.
 * - Erreichbarkeit: nur Tiers mit `ilvl <= Itemstufe` werden gezeigt; faellt
 *   eine Familie damit ganz weg, erscheint sie nicht.
 */

export interface RepoeQueryContext {
  /** Eingestellte Itemstufe. Tiers mit hoeherem ilvl fallen heraus. */
  itemLevel: number
}

/** Ein erreichbarer Tier einer Familie. */
export interface RepoeTier {
  /** repoe-Mod-ID dieses Tiers (eindeutig, auch React-Key innerhalb der Zeile). */
  id: string
  /** Tier innerhalb der Familie; 1 ist das hoechste (groesstes ilvl). */
  tier: number
  /** Anzahl Tiers der Familie insgesamt (volle Liste, vor dem Filter). */
  tierCount: number
  /** Ab dieser Itemstufe erreichbar. */
  ilvl: number
  /** Affix-Name (kann leer sein). */
  name: string
  /** Original-Spieltext dieses Tiers. */
  text: string
  /** Rollen-Bereiche dieses Tiers als [min, max]-Paare. */
  values: [number, number][]
}

/** Eine Anzeige-Zeile: genau eine Modifier-Familie mit ihren Tiers. */
export interface RepoeGroup {
  /** Familien-ID (Mod-ID); zugleich stabiler React-Key. */
  id: string
  /** Praefix/Suffix, oder null (Corrupted/Essence – kein Slot). */
  slot: Slot | null
  origin: Origin
  /** Anzeige-Text der Familie (Text des hoechsten Tiers). */
  text: string
  /** Eignungs-Tags der Familie (Basis-Abgleich). */
  tags: string[]
  /** Beschreibende Tags fuer die Filter-Pills (fire, cold, caster …). */
  filterTags: string[]
  /** Erreichbare Tiers, nach Tier aufsteigend (Tier 1 zuerst). */
  tiers: RepoeTier[]
}

/**
 * Tags, die keine Eignung stiften duerfen: die Domaenen-Isolationsmarker
 * (`__dom_*`, allgemein alles mit `__`-Praefix) und der ueberall vorhandene
 * `default`-Tag. Beide liegen auf nahezu jeder Basis und – je nach Herkunft –
 * auch auf den Mods. Als Eignungssignal gewertet, wuerden sie herkunftsfremde
 * Mods auf falsche Basen ziehen (z. B. Ruestungs-/Schmuck-Corrupted auf Waffen,
 * die nur den gemeinsamen `__dom_item`-Marker teilen).
 */
function isEligibilityTag(tag: string): boolean {
  return tag !== 'default' && !tag.startsWith('__')
}

/**
 * Ob eine Familie auf eine Basis passt: teilt sie mindestens einen echten
 * Eignungs-Tag. Domaenen-Marker (`__…`) und `default` zaehlen dabei nicht.
 */
export function modFitsBase(
  mod: Mod,
  baseTags: ReadonlySet<string>,
): boolean {
  return mod.tags.some((t) => isEligibilityTag(t) && baseTags.has(t))
}

/**
 * Weist den Tiers einer Familie ihre Tier-Nummer zu (hoechstes ilvl = Tier 1)
 * und liefert die bei der Itemstufe erreichbaren Tiers samt Rang und tierCount.
 * Der Rang wird ueber die volle Tier-Liste vergeben, damit er stabil bleibt,
 * auch wenn hohe Tiers durch die Itemstufe herausfallen.
 */
function reachableTiers(mod: Mod, itemLevel: number): RepoeTier[] {
  const ranked = [...mod.tiers]
    .map((t, index) => ({ t, index }))
    .sort((a, b) => b.t.ilvl - a.t.ilvl || a.index - b.index)
  const tierCount = ranked.length
  const out: RepoeTier[] = []
  ranked.forEach(({ t }, i) => {
    if (t.ilvl > itemLevel) return
    out.push({
      id: t.id,
      tier: i + 1,
      tierCount,
      ilvl: t.ilvl,
      name: t.name,
      text: t.text,
      values: t.values,
    })
  })
  return out
}

/**
 * Fuehrt die Query fuer eine Basis und eine Herkunft aus: waehlt die passenden
 * Familien (Herkunft + Eignung), loest die erreichbaren Tiers auf und sortiert
 * die Zeilen nach Familien-Label. Die aufrufende Ansicht trennt bei Bedarf nach
 * `slot`.
 */
export function runRepoeQuery(
  mods: readonly Mod[],
  baseTags: readonly string[],
  origin: Origin,
  ctx: RepoeQueryContext,
): RepoeGroup[] {
  const tagSet = new Set(baseTags)
  const groups: RepoeGroup[] = []
  for (const mod of mods) {
    if (mod.origin !== origin) continue
    if (!modFitsBase(mod, tagSet)) continue
    const tiers = reachableTiers(mod, ctx.itemLevel)
    if (tiers.length === 0) continue
    groups.push({
      id: mod.id,
      slot: mod.slot,
      origin: mod.origin,
      text: mod.text,
      tags: mod.tags,
      filterTags: mod.filterTags,
      tiers,
    })
  }
  groups.sort((a, b) =>
    modFamilyLabel(a.text).localeCompare(modFamilyLabel(b.text)),
  )
  return groups
}

/**
 * Baut die Anzeige-Zeilen des Warp-Runen-Abschnitts (Herkunft `warp`). Diese
 * Mods haengen an ihrem Themen-Tag (destruction, berserking, …), nicht an
 * Basis-Tags; welche Rune auf welchen Slot passt, gibt `allowedThemes` vor
 * (aus der Slot-Bindung, siehe `lib/warp.ts`). Es zaehlen also nur warp-Mods,
 * deren Themen-Tag in `allowedThemes` liegt, mit den bei der Itemstufe
 * erreichbaren Tiers. Slot (Praefix/Suffix) bleibt erhalten.
 */
export function warpGroups(
  mods: readonly Mod[],
  allowedThemes: readonly string[],
  ctx: RepoeQueryContext,
): RepoeGroup[] {
  if (allowedThemes.length === 0) return []
  const allow = new Set(allowedThemes)
  const groups: RepoeGroup[] = []
  for (const mod of mods) {
    if (mod.origin !== 'warp') continue
    if (!mod.tags.some((t) => allow.has(t))) continue
    const tiers = reachableTiers(mod, ctx.itemLevel)
    if (tiers.length === 0) continue
    groups.push({
      id: mod.id,
      slot: mod.slot,
      origin: mod.origin,
      text: mod.text,
      tags: mod.tags,
      filterTags: mod.filterTags,
      tiers,
    })
  }
  groups.sort((a, b) =>
    modFamilyLabel(a.text).localeCompare(modFamilyLabel(b.text)),
  )
  return groups
}

/**
 * Baut die Anzeige-Zeilen des Essence-Abschnitts aus den aufbereiteten
 * Essence-Eintraegen einer Item-Klasse. Anders als der rollbare Pool gibt es
 * hier keine Stufen: je Eintrag genau ein Tier mit dem Bereich ueber alle
 * Essence-Stufen. Eintraege oberhalb der Itemstufe fallen heraus; sortiert nach
 * Familien-Label. `tags` (Eignung) bleibt leer – der Essence-Abschnitt wird
 * ueber die Item-Klasse ausgewaehlt, nicht ueber Tag-Eignung; `filterTags`
 * (beschreibend) werden jedoch durchgereicht, damit die Filter-Pills auch hier
 * greifen.
 */
export function essenceGroups(
  entries: readonly EssenceEntry[],
  ctx: RepoeQueryContext,
): RepoeGroup[] {
  const groups: RepoeGroup[] = []
  for (const e of entries) {
    if (e.ilvl > ctx.itemLevel) continue
    groups.push({
      id: e.id,
      slot: e.slot,
      origin: 'essence',
      text: e.text,
      tags: [],
      filterTags: e.filterTags,
      tiers: [
        {
          id: e.id,
          tier: 1,
          tierCount: 1,
          ilvl: e.ilvl,
          name: '',
          text: e.text,
          values: e.values,
        },
      ],
    })
  }
  groups.sort((a, b) =>
    modFamilyLabel(a.text).localeCompare(modFamilyLabel(b.text)),
  )
  return groups
}
