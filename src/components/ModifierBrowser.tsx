import { useMemo, useState } from 'react'
import { ChevronsDownUp, ChevronsUpDown } from 'lucide-react'
import type { ItemType, Mod } from '@/data/schema.coe'
import type { BrowserSearch } from '@/routes/$type'
import { useMods, useBaseMods } from '@/hooks/useGameData'
import { runBaseQuery } from '@/lib/query/baseEngine'
import type { ModGroup } from '@/lib/query/baseEngine'
import { filterResult, availableTags } from '@/lib/query/filter'
import type { ColorTag } from '@/lib/modTags'
import { VariantSelect } from '@/components/VariantSelect'
import { ModColumn } from '@/components/ModColumn'
import { ViewSwitcher } from '@/components/ViewSwitcher'
import { FilterBar } from '@/components/FilterBar'

const MIN_ITEM_LEVEL = 1
const MAX_ITEM_LEVEL = 100

function keyOf(g: ModGroup): string {
  return `${g.slot}-${g.group}`
}

/**
 * Modifier-Browser je Item-Typ (Screen 2). Die Basis-Varianten kommen direkt
 * aus dem Item-Typ (item_types.json); die gewaehlte Variante liefert ihre
 * Basis-Id, ueber die base_mods die rollbaren Mods samt Tiers bereitstellt.
 * Praefixe/Suffixe getrennt, drei Darstellungen, Facet-Filter (Suche, Tag-Pills,
 * Itemstufe). Filterzustand liegt im URL-State (Props `search`/`patchSearch`);
 * nur das Ein-/Ausklappen ist lokal. Query- und Filter-Logik bleiben in den
 * reinen Modulen `runBaseQuery`/`filterResult`.
 */
export function ModifierBrowser({
  itemType,
  search,
  patchSearch,
}: {
  itemType: ItemType
  search: BrowserSearch
  patchSearch: (patch: Partial<BrowserSearch>) => void
}) {
  const mods = useMods()
  const baseMods = useBaseMods()

  const variants = itemType.variants
  const selected =
    variants.find((v) => v.base === search.v) ?? variants[0] ?? null

  const [expandedKeys, setExpandedKeys] = useState<ReadonlySet<string>>(
    new Set(),
  )

  const modsById = useMemo(() => {
    const map = new Map<string, Mod>()
    for (const m of mods.data ?? []) map.set(m.id, m)
    return map
  }, [mods.data])

  const result = useMemo(() => {
    if (!mods.data || !baseMods.data || !selected) return null
    const rows = baseMods.data[selected.base] ?? []
    return runBaseQuery(rows, modsById, { itemLevel: search.ilvl })
  }, [mods.data, baseMods.data, modsById, selected, search.ilvl])

  const tags = useMemo(() => (result ? availableTags(result) : []), [result])

  const filtered = useMemo(
    () =>
      result
        ? filterResult(result, { tags: search.tags, search: search.q })
        : null,
    [result, search.tags, search.q],
  )

  const allKeys = useMemo(() => {
    if (!filtered) return [] as string[]
    return [...filtered.prefixes, ...filtered.suffixes].map(keyOf)
  }, [filtered])

  // Standard: alles eingeklappt. Gefuehrt wird die Menge der ausgeklappten
  // Gruppen; nicht enthaltene (auch neu durch Filter entstandene) gelten als
  // eingeklappt. Nach aussen weiterhin ein collapsedKeys-Set.
  const collapsedKeys = useMemo(() => {
    const s = new Set<string>()
    for (const k of allKeys) if (!expandedKeys.has(k)) s.add(k)
    return s
  }, [allKeys, expandedKeys])

  const allCollapsed =
    allKeys.length === 0 || !allKeys.some((k) => expandedKeys.has(k))

  const toggleKey = (key: string) =>
    setExpandedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const toggleAll = () =>
    setExpandedKeys(allCollapsed ? new Set(allKeys) : new Set())

  const toggleTag = (tag: ColorTag) => {
    const active = new Set(search.tags)
    if (active.has(tag)) active.delete(tag)
    else active.add(tag)
    patchSearch({ tags: [...active] })
  }

  const isPending = mods.isPending || baseMods.isPending
  const error = mods.error ?? baseMods.error

  if (error) {
    return (
      <p className="mt-8 text-sm text-destructive">
        Modifier konnten nicht geladen werden: {error.message}
      </p>
    )
  }
  if (isPending) {
    return <p className="mt-8 text-sm text-secondary-text">Lade Modifier …</p>
  }
  if (!selected || !result || !filtered) {
    return (
      <p className="mt-8 text-sm text-secondary-text">
        Für diesen Item-Typ liegen keine Basen vor.
      </p>
    )
  }

  const CollapseIcon = allCollapsed ? ChevronsUpDown : ChevronsDownUp

  return (
    <div className="mt-6">
      {variants.length > 1 && (
        <div className="mb-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-text">
            Basis
          </p>
          <VariantSelect
            variants={variants}
            selectedBase={selected.base}
            onSelect={(base) => patchSearch({ v: base })}
          />
        </div>
      )}

      <FilterBar
        search={search.q}
        onSearch={(q) => patchSearch({ q })}
        availableTags={tags}
        activeTags={search.tags}
        onToggleTag={toggleTag}
        itemLevel={search.ilvl}
        minLevel={MIN_ITEM_LEVEL}
        maxLevel={MAX_ITEM_LEVEL}
        onItemLevel={(ilvl) => patchSearch({ ilvl })}
      />

      <p className="mb-4 text-[12px] text-dim">
        Gewicht und Chance beruhen auf geschätzten Spawn-Gewichten (Craft of
        Exile).
      </p>

      <div className="mb-5 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={toggleAll}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-raised px-2.5 py-1.5 text-[12.5px] font-semibold text-secondary-text transition-colors hover:text-body"
        >
          <CollapseIcon className="size-3.5" strokeWidth={2} aria-hidden />
          <span className="hidden sm:inline">
            {allCollapsed ? 'Alle ausklappen' : 'Alle einklappen'}
          </span>
        </button>
        <ViewSwitcher
          value={search.view}
          onChange={(view) => patchSearch({ view })}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-6">
        <ModColumn
          slot="prefix"
          groups={filtered.prefixes}
          view={search.view}
          collapsedKeys={collapsedKeys}
          onToggle={toggleKey}
        />
        <ModColumn
          slot="suffix"
          groups={filtered.suffixes}
          view={search.view}
          collapsedKeys={collapsedKeys}
          onToggle={toggleKey}
        />
      </div>
    </div>
  )
}
