import { useMemo, useState } from 'react'
import { ChevronsDownUp, ChevronsUpDown } from 'lucide-react'
import type { ItemType } from '@/data/schema'
import { useMods, useBaseItems } from '@/hooks/useGameData'
import { deriveVariants } from '@/lib/baseVariants'
import { runQuery } from '@/lib/query/engine'
import type { ModGroup } from '@/lib/query/engine'
import { VariantSelect } from '@/components/VariantSelect'
import { ModColumn } from '@/components/ModColumn'
import { ViewSwitcher } from '@/components/ViewSwitcher'
import type { ModView } from '@/components/ViewSwitcher'

/** Feste Itemstufe, bis der Slider (Phase 4) sie steuerbar macht. */
const DEFAULT_ITEM_LEVEL = 100

function keyOf(g: ModGroup): string {
  return `${g.slot}-${g.group}`
}

/**
 * Modifier-Browser je Item-Typ (Screen 2). Basis-Varianten aus den Daten,
 * Umschalter, Praefixe/Suffixe getrennt. Darstellung als Karten/Tabelle/Balken,
 * Familien ein-/ausklappbar. Query-Logik bleibt im reinen Modul `runQuery`.
 */
export function ModifierBrowser({ itemType }: { itemType: ItemType }) {
  const mods = useMods()
  const baseItems = useBaseItems()

  const variants = useMemo(
    () => deriveVariants(baseItems.data ?? [], itemType.id),
    [baseItems.data, itemType.id],
  )

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected =
    variants.find((v) => v.id === selectedId) ?? variants[0] ?? null

  const [view, setView] = useState<ModView>('cards')
  const [collapsedKeys, setCollapsedKeys] = useState<ReadonlySet<string>>(
    new Set(),
  )

  const result = useMemo(() => {
    if (!mods.data || !selected) return null
    return runQuery(mods.data, {
      tags: selected.tags,
      itemLevel: DEFAULT_ITEM_LEVEL,
    })
  }, [mods.data, selected])

  const allKeys = useMemo(() => {
    if (!result) return [] as string[]
    return [...result.prefixes, ...result.suffixes].map(keyOf)
  }, [result])

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
  if (!selected || !result) {
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
            onSelect={setSelectedId}
          />
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-secondary-text">
          Itemstufe{' '}
          <span className="font-mono tabular-nums text-body">
            {DEFAULT_ITEM_LEVEL}
          </span>{' '}
          · voller Pool
        </p>
        <div className="flex items-center gap-2">
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
          <ViewSwitcher value={view} onChange={setView} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-6">
        <ModColumn
          slot="prefix"
          groups={result.prefixes}
          view={view}
          collapsedKeys={collapsedKeys}
          onToggle={toggleKey}
        />
        <ModColumn
          slot="suffix"
          groups={result.suffixes}
          view={view}
          collapsedKeys={collapsedKeys}
          onToggle={toggleKey}
        />
      </div>
    </div>
  )
}
