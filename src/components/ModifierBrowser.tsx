import { useMemo, useState } from 'react'
import { ChevronsDownUp, ChevronsUpDown } from 'lucide-react'
import type { ItemType, Mod, Origin } from '@/data/schema.coe'
import type { BrowserSearch } from '@/routes/$type'
import { useMods, useBaseMods } from '@/hooks/useGameData'
import {
  runBaseQuery,
  runFlatQuery,
  filterRowsByOrigin,
} from '@/lib/query/baseEngine'
import type { DisplayGroup } from '@/lib/query/baseEngine'
import { filterGroups, availableTags } from '@/lib/query/filter'
import type { ColorTag } from '@/lib/modTags'
import type { Accent } from '@/components/ui/accent'
import { VariantSelect } from '@/components/VariantSelect'
import { ModColumn } from '@/components/ModColumn'
import { ViewSwitcher } from '@/components/ViewSwitcher'
import { FilterBar } from '@/components/FilterBar'
import { cn } from '@/lib/utils'

const MIN_ITEM_LEVEL = 1
const MAX_ITEM_LEVEL = 100

/** Reihenfolge und Beschriftung der Herkunft-Reiter. */
const ORIGIN_ORDER: Origin[] = ['rollable', 'desecrated', 'corrupted']
const ORIGIN_LABEL: Record<Origin, string> = {
  rollable: 'Rollbar',
  desecrated: 'Desecrated',
  corrupted: 'Corrupted',
}

/** Eine darzustellende Spalte (Präfixe, Suffixe oder flache Corrupted-Liste). */
interface Column {
  accent: Accent
  title: string
  showProbability: boolean
  groups: DisplayGroup[]
}

/**
 * Modifier-Browser je Item-Typ (Screen 2). Reiter je Herkunft: rollbar und
 * Desecrated als Präfix/Suffix-Spalten (nur rollbar mit Chance), Corrupted als
 * flache Liste ohne Slot und ohne Chance. Es werden nur die Herkünfte gezeigt,
 * die die gewählte Basis wirklich hat. Filterzustand (Reiter, Suche, Tags,
 * Itemstufe) liegt im URL-State; nur das Ein-/Ausklappen ist lokal. Query- und
 * Filter-Logik bleiben in den reinen Modulen.
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

  const rows = useMemo(
    () =>
      baseMods.data && selected ? (baseMods.data[selected.base] ?? []) : [],
    [baseMods.data, selected],
  )

  // Welche Herkünfte hat diese Basis? Nur diese bekommen einen Reiter.
  const origins = useMemo(
    () =>
      ORIGIN_ORDER.filter(
        (o) => filterRowsByOrigin(rows, modsById, o).length > 0,
      ),
    [rows, modsById],
  )
  const activeOrigin: Origin = origins.includes(search.origin)
    ? search.origin
    : (origins[0] ?? 'rollable')

  // Ungefilterte Spalten des aktiven Reiters.
  const rawColumns = useMemo<Column[]>(() => {
    const ctx = { itemLevel: search.ilvl }
    const originRows = filterRowsByOrigin(rows, modsById, activeOrigin)
    if (activeOrigin === 'corrupted') {
      return [
        {
          accent: 'corrupted',
          title: 'Corrupted',
          showProbability: false,
          groups: runFlatQuery(originRows, modsById, ctx),
        },
      ]
    }
    const result = runBaseQuery(originRows, modsById, ctx)
    const showProbability = activeOrigin === 'rollable'
    return [
      { accent: 'prefix', title: 'Präfixe', showProbability, groups: result.prefixes },
      { accent: 'suffix', title: 'Suffixe', showProbability, groups: result.suffixes },
    ]
  }, [rows, modsById, activeOrigin, search.ilvl])

  const tags = useMemo(
    () => availableTags(rawColumns.flatMap((c) => c.groups)),
    [rawColumns],
  )

  const columns = useMemo<Column[]>(
    () =>
      rawColumns.map((c) => ({
        ...c,
        groups: filterGroups(c.groups, { tags: search.tags, search: search.q }),
      })),
    [rawColumns, search.tags, search.q],
  )

  const allKeys = useMemo(
    () =>
      columns.flatMap((c) => c.groups.map((g) => `${c.accent}-${g.group}`)),
    [columns],
  )

  // Standard: alles eingeklappt. Gefuehrt wird die Menge der ausgeklappten
  // Gruppen; nicht enthaltene gelten als eingeklappt.
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

  // Reiterwechsel setzt die Tag-Auswahl zurück (Tags sind reiterspezifisch).
  const selectOrigin = (origin: Origin) => patchSearch({ origin, tags: [] })

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
  if (!selected) {
    return (
      <p className="mt-8 text-sm text-secondary-text">
        Für diesen Item-Typ liegen keine Basen vor.
      </p>
    )
  }

  const CollapseIcon = allCollapsed ? ChevronsUpDown : ChevronsDownUp
  const showProbabilityHint = activeOrigin === 'rollable'

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

      {origins.length > 1 && (
        <div className="mb-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-text">
            Herkunft
          </p>
          <div className="inline-flex flex-wrap gap-0.5 rounded-md border border-border bg-surface-raised p-0.5">
            {origins.map((o) => {
              const active = o === activeOrigin
              return (
                <button
                  key={o}
                  type="button"
                  onClick={() => selectOrigin(o)}
                  aria-pressed={active}
                  className={cn(
                    'rounded-[10px] px-3 py-1.5 text-[12.5px] font-semibold transition-colors',
                    active
                      ? 'bg-accent text-heading'
                      : 'text-secondary-text hover:text-body',
                  )}
                >
                  {ORIGIN_LABEL[o]}
                </button>
              )
            })}
          </div>
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

      {showProbabilityHint ? (
        <p className="mb-4 text-[12px] text-dim">
          Gewicht und Chance beruhen auf geschätzten Spawn-Gewichten (Craft of
          Exile).
        </p>
      ) : activeOrigin === 'desecrated' ? (
        <p className="mb-4 text-[12px] text-dim">
          Desecrated-Modifier werden über Abyssal-Knochen am Well of Souls
          gesetzt; sie haben keine Spawn-Chance. Viele erfordern Itemstufe 65.
        </p>
      ) : (
        <p className="mb-4 text-[12px] text-dim">
          Corrupted-Modifier werden per Vaal-Corruption gesetzt und belegen
          keinen Präfix/Suffix-Slot; sie haben keine Spawn-Chance.
        </p>
      )}

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

      <div
        className={cn(
          'grid grid-cols-1 gap-8 md:gap-6',
          columns.length > 1 && 'md:grid-cols-2',
        )}
      >
        {columns.map((c) => (
          <ModColumn
            key={c.accent}
            title={c.title}
            accent={c.accent}
            showProbability={c.showProbability}
            groups={c.groups}
            view={search.view}
            collapsedKeys={collapsedKeys}
            onToggle={toggleKey}
          />
        ))}
      </div>
    </div>
  )
}
