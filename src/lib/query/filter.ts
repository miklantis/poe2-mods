import type { DisplayGroup, QueryResult } from './baseEngine'
import { displayTags, COLOR_TAG_ORDER } from '@/lib/modTags'
import type { ColorTag } from '@/lib/modTags'
import { cleanModText, modFamilyLabel } from '@/lib/modText'

/**
 * Nachgelagerte Filter auf Anzeige-Gruppen. DOM-frei und testbar; getrennt von
 * der Engine, die nur Domain/Slot/Itemstufe/Gewicht kennt. Arbeitet auf dem
 * gemeinsamen `DisplayGroup` – gilt damit fuer Praefix/Suffix (rollbar,
 * Desecrated) wie fuer die flache Corrupted-Liste.
 *
 * - Tags: ODER-Verknuepfung. Eine Gruppe bleibt, wenn ihre Typ-Tags mindestens
 *   einen der aktiven Tags enthalten. Ohne aktive Tags kein Tag-Filter.
 * - Suche: alle Tokens (durch Leerzeichen getrennt) muessen im Familien-Label
 *   oder in einem Tier-Text vorkommen (case-insensitiv).
 */

export interface FilterCriteria {
  tags: readonly string[]
  search: string
}

const ORDER_INDEX = new Map<string, number>(
  COLOR_TAG_ORDER.map((t, i) => [t, i]),
)

/** Alle in den Gruppen vorkommenden Farb-Tags, in fester Reihenfolge. */
export function availableTags(groups: readonly DisplayGroup[]): ColorTag[] {
  const present = new Set<ColorTag>()
  for (const g of groups) {
    const top = g.mods[0]
    if (top) for (const t of displayTags(top.mod)) present.add(t)
  }
  return [...present].sort((a, b) => ORDER_INDEX.get(a)! - ORDER_INDEX.get(b)!)
}

function tokensOf(search: string): string[] {
  return search
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 0)
}

function matchesTags(group: DisplayGroup, tags: readonly string[]): boolean {
  if (tags.length === 0) return true
  const top = group.mods[0]
  if (!top) return false
  const groupTags = new Set<string>(displayTags(top.mod))
  return tags.some((t) => groupTags.has(t))
}

function matchesSearch(group: DisplayGroup, tokens: readonly string[]): boolean {
  if (tokens.length === 0) return true
  const top = group.mods[0]
  const parts: string[] = top ? [modFamilyLabel(top.mod.text)] : [group.group]
  for (const m of group.mods) parts.push(cleanModText(m.mod.text))
  const haystack = parts.join(' ').toLowerCase()
  return tokens.every((tok) => haystack.includes(tok))
}

/** Filtert eine Gruppenliste nach den Kriterien; Typ bleibt erhalten. */
export function filterGroups<T extends DisplayGroup>(
  groups: readonly T[],
  criteria: FilterCriteria,
): T[] {
  const tokens = tokensOf(criteria.search)
  return groups.filter(
    (g) => matchesTags(g, criteria.tags) && matchesSearch(g, tokens),
  )
}

/** Filtert Praefixe und Suffixe (rollbar/Desecrated) nach den Kriterien. */
export function filterResult(
  result: QueryResult,
  criteria: FilterCriteria,
): { prefixes: QueryResult['prefixes']; suffixes: QueryResult['suffixes'] } {
  return {
    prefixes: filterGroups(result.prefixes, criteria),
    suffixes: filterGroups(result.suffixes, criteria),
  }
}
