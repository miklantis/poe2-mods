import type { ModGroup, QueryResult } from './baseEngine'
import { displayTags, COLOR_TAG_ORDER } from '@/lib/modTags'
import type { ColorTag } from '@/lib/modTags'
import { cleanModText, modFamilyLabel } from '@/lib/modText'

/**
 * Nachgelagerte Filter auf das Query-Ergebnis. DOM-frei und testbar; getrennt
 * von `runQuery`, das nur Domain/Slot/Itemstufe/Gewicht kennt.
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

/** Alle im Ergebnis vorkommenden Farb-Tags, in fester Reihenfolge. */
export function availableTags(result: QueryResult): ColorTag[] {
  const present = new Set<ColorTag>()
  for (const g of [...result.prefixes, ...result.suffixes]) {
    const top = g.mods[0]
    if (top) for (const t of displayTags(top.mod)) present.add(t)
  }
  return [...present].sort(
    (a, b) => ORDER_INDEX.get(a)! - ORDER_INDEX.get(b)!,
  )
}

function matchesTags(group: ModGroup, tags: readonly string[]): boolean {
  if (tags.length === 0) return true
  const top = group.mods[0]
  if (!top) return false
  const groupTags = new Set<string>(displayTags(top.mod))
  return tags.some((t) => groupTags.has(t))
}

function matchesSearch(group: ModGroup, tokens: readonly string[]): boolean {
  if (tokens.length === 0) return true
  const top = group.mods[0]
  const parts: string[] = top ? [modFamilyLabel(top.mod.text)] : [group.group]
  for (const m of group.mods) parts.push(cleanModText(m.mod.text))
  const haystack = parts.join(' ').toLowerCase()
  return tokens.every((tok) => haystack.includes(tok))
}

function filterGroups(
  groups: readonly ModGroup[],
  tags: readonly string[],
  tokens: readonly string[],
): ModGroup[] {
  return groups.filter(
    (g) => matchesTags(g, tags) && matchesSearch(g, tokens),
  )
}

/** Filtert Praefixe und Suffixe nach den Kriterien. */
export function filterResult(
  result: QueryResult,
  criteria: FilterCriteria,
): { prefixes: ModGroup[]; suffixes: ModGroup[] } {
  const tokens = criteria.search
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 0)
  return {
    prefixes: filterGroups(result.prefixes, criteria.tags, tokens),
    suffixes: filterGroups(result.suffixes, criteria.tags, tokens),
  }
}
