import type { RepoeGroup } from './repoeEngine'
import { displayTags, COLOR_TAG_ORDER } from '@/lib/modTags'
import type { ColorTag } from '@/lib/modTags'
import { cleanModText, modFamilyLabel } from '@/lib/modText'

/**
 * Nachgelagerte Filter auf Anzeige-Gruppen. DOM-frei und testbar; getrennt von
 * der Engine, die nur Herkunft/Eignung/Itemstufe kennt. Arbeitet auf dem
 * gemeinsamen `RepoeGroup` – gilt damit fuer alle Herkuenfte gleich.
 *
 * - Tags: ODER-Verknuepfung. Eine Gruppe bleibt, wenn ihre Eignungs-Tags
 *   mindestens einen der aktiven Tags enthalten. Ohne aktive Tags kein
 *   Tag-Filter.
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
export function availableTags(groups: readonly RepoeGroup[]): ColorTag[] {
  const present = new Set<ColorTag>()
  for (const g of groups) {
    for (const t of displayTags(g.tags)) present.add(t)
  }
  return [...present].sort((a, b) => ORDER_INDEX.get(a)! - ORDER_INDEX.get(b)!)
}

function tokensOf(search: string): string[] {
  return search
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 0)
}

function matchesTags(group: RepoeGroup, tags: readonly string[]): boolean {
  if (tags.length === 0) return true
  const groupTags = new Set<string>(displayTags(group.tags))
  return tags.some((t) => groupTags.has(t))
}

function matchesSearch(group: RepoeGroup, tokens: readonly string[]): boolean {
  if (tokens.length === 0) return true
  const parts: string[] = [modFamilyLabel(group.text)]
  for (const t of group.tiers) parts.push(cleanModText(t.text))
  const haystack = parts.join(' ').toLowerCase()
  return tokens.every((tok) => haystack.includes(tok))
}

/** Filtert eine Gruppenliste nach den Kriterien; Typ bleibt erhalten. */
export function filterGroups<T extends RepoeGroup>(
  groups: readonly T[],
  criteria: FilterCriteria,
): T[] {
  const tokens = tokensOf(criteria.search)
  return groups.filter(
    (g) => matchesTags(g, criteria.tags) && matchesSearch(g, tokens),
  )
}
