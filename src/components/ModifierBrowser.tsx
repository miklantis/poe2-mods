import { useMemo, useState } from 'react'
import { ChevronsDownUp, ChevronsUpDown } from 'lucide-react'
import type { ItemType } from '@/data/schema'
import type { BrowserSearch } from '@/routes/$type'
import { useMods, useBaseItems } from '@/hooks/useGameData'
import { deriveVariants } from '@/lib/baseVariants'
import { runQuery } from '@/lib/query/engine'
import type { ModGroup } from '@/lib/query/engine'
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
 * Modifier-Browser je Item-Typ (Screen 2). Basis-Varianten aus den Daten,
 * Umschalter, Praefixe/Suffixe getrennt, drei Darstellungen, Facet-Filter
 * (Suche, Tag-Pills, Itemstufe). Filterzustand liegt im URL-State (Props
 * `search`/`patchSearch`); nur das Ein-/Ausklappen ist lokal. Query- und
 * Filter-Logik bleiben in den reinen Modulen `runQuery`/`filterResult`.
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
  const baseItems = useBaseItems()

  const variants = useMemo(
    () => deriveVariants(baseItems.data ?? [], itemType.id),
    [baseItems.data, itemType.id],
  )

  const selected = variants.find((v) => v.id === search.v) ?? variants[0] ?? null
  const [collapsedKeys, setCollapsedKeys] = useState<ReadonlySet<string>>(
    new Set(),
  )

  const result = useMemo(() => {
    if (!mods.data || !selected) return null
    return runQuery(mods.data, { tags: selected.tags, itemLevel: search.ilvl })
  }, [mods.data, selected, search.ilvl])

  const tags = useMemo(
    () => (result ? availableTags(result) : []),
    [result],
  )

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

  const allCollapsed =
    allKeys.length > 0 && allKeys.every((k) => collapsedKeys.has(k))

  const toggleKey = (key: string) =>
    setCollapsedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const toggleAll = () =>
    setCollapsedKeys(allCollapsed ? new Set() : new Set(allKeys))

  const toggleTag = (tag: ColorTag) => {
    const active = new Set(search.tags)
    if (active.has(tag)) active.delete(tag)
    else active.add(tag)
    patchSearch({ tags: [...active] })
  }

  const isPending = mods.isPending || baseItems.isPending
  const error = mods.error ?? baseItems.error

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
            selectedId={selected.id}
            onSelect={(id) => patchSearch({ v: id })}
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
