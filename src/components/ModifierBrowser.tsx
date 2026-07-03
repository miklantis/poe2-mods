import { useMemo, useState } from 'react'
import { ChevronsDownUp, ChevronsUpDown } from 'lucide-react'
import type { ItemType, Mod } from '@/data/schema.coe'
import type { BrowserSearch } from '@/routes/$type'
import { useMods, useBaseMods, useEssences } from '@/hooks/useGameData'
import {
  runBaseQuery,
  runFlatQuery,
  filterRowsByOrigin,
} from '@/lib/query/baseEngine'
import { runEssenceQuery } from '@/lib/query/essenceEngine'
import { filterGroups, availableTags } from '@/lib/query/filter'
import type { ColorTag } from '@/lib/modTags'
import { VariantSelect } from '@/components/VariantSelect'
import { ModColumn } from '@/components/ModColumn'
import { EssenceColumn } from '@/components/EssenceColumn'
import { FilterBar } from '@/components/FilterBar'

const MIN_ITEM_LEVEL = 1
const MAX_ITEM_LEVEL = 100

/**
 * Modifier-Browser je Item-Typ (Screen 2). Alle Herkünfte gleichzeitig, ohne
 * Umschalten: oben der rollbare Pool (Präfixe blau, Suffixe gelb, mit Chance),
 * darunter Desecrated (Präfixe/Suffixe, grün, ohne Chance), dann Essence
 * (Präfixe/Suffixe, violett, je Mod eine Zeile mit Bereich über alle Stufen,
 * ohne Chance) und ganz unten Corrupted (eine breite Tabelle, rot, ohne
 * Chance). Ein gemeinsamer Filter (Suche, Tags, Itemstufe) wirkt auf alle
 * Abschnitte; Darstellung ist stets die Tabelle. Filterzustand liegt im
 * URL-State, nur das Ein-/Ausklappen ist lokal. Query- und Filter-Logik bleiben
 * in den reinen Modulen.
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
  const essences = useEssences()

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

  const essenceRows = useMemo(
    () =>
      essences.data && selected ? (essences.data[selected.base] ?? []) : [],
    [essences.data, selected],
  )

  // Rohe Gruppen je Herkunft (vor dem Suchfilter, nach Itemstufe).
  const raw = useMemo(() => {
    const ctx = { itemLevel: search.ilvl }
    return {
      roll: runBaseQuery(filterRowsByOrigin(rows, modsById, 'rollable'), modsById, ctx),
      des: runBaseQuery(filterRowsByOrigin(rows, modsById, 'desecrated'), modsById, ctx),
      ess: runEssenceQuery(essenceRows, modsById, ctx),
      cor: runFlatQuery(filterRowsByOrigin(rows, modsById, 'corrupted'), modsById, ctx),
    }
  }, [rows, essenceRows, modsById, search.ilvl])

  const hasDesecrated = raw.des.prefixes.length + raw.des.suffixes.length > 0
  const hasEssence = raw.ess.prefixes.length + raw.ess.suffixes.length > 0
  const hasCorrupted = raw.cor.length > 0

  const tags = useMemo(
    () =>
      availableTags([
        ...raw.roll.prefixes,
        ...raw.roll.suffixes,
        ...raw.des.prefixes,
        ...raw.des.suffixes,
        ...raw.ess.prefixes,
        ...raw.ess.suffixes,
        ...raw.cor,
      ]),
    [raw],
  )

  // Suchfilter auf jede Liste anwenden.
  const f = useMemo(() => {
    const c = { tags: search.tags, search: search.q }
    return {
      rollPre: filterGroups(raw.roll.prefixes, c),
      rollSuf: filterGroups(raw.roll.suffixes, c),
      desPre: filterGroups(raw.des.prefixes, c),
      desSuf: filterGroups(raw.des.suffixes, c),
      essPre: filterGroups(raw.ess.prefixes, c),
      essSuf: filterGroups(raw.ess.suffixes, c),
      cor: filterGroups(raw.cor, c),
    }
  }, [raw, search.tags, search.q])

  const allKeys = useMemo(
    () => [
      ...f.rollPre.map((g) => `r-pre-${g.group}`),
      ...f.rollSuf.map((g) => `r-suf-${g.group}`),
      ...f.desPre.map((g) => `d-pre-${g.group}`),
      ...f.desSuf.map((g) => `d-suf-${g.group}`),
      ...f.cor.map((g) => `c-${g.group}`),
    ],
    [f],
  )

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

  const isPending = mods.isPending || baseMods.isPending || essences.isPending
  const error = mods.error ?? baseMods.error ?? essences.error

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

      <div className="mb-6 flex items-center justify-between gap-3">
        <p className="text-[12px] text-dim">
          Chance nur im rollbaren Pool (geschätzte Spawn-Gewichte, Craft of
          Exile). Desecrated, Essence und Corrupted werden gezielt gesetzt.
        </p>
        <button
          type="button"
          onClick={toggleAll}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-surface-raised px-2.5 py-1.5 text-[12.5px] font-semibold text-secondary-text transition-colors hover:text-body"
        >
          <CollapseIcon className="size-3.5" strokeWidth={2} aria-hidden />
          <span className="hidden sm:inline">
            {allCollapsed ? 'Alle ausklappen' : 'Alle einklappen'}
          </span>
        </button>
      </div>

      {/* Rollbar */}
      <section>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-6">
          <ModColumn
            title="Präfixe"
            accent="prefix"
            keyNs="r-pre"
            showProbability
            groups={f.rollPre}
            collapsedKeys={collapsedKeys}
            onToggle={toggleKey}
          />
          <ModColumn
            title="Suffixe"
            accent="suffix"
            keyNs="r-suf"
            showProbability
            groups={f.rollSuf}
            collapsedKeys={collapsedKeys}
            onToggle={toggleKey}
          />
        </div>
      </section>

      {/* Desecrated */}
      {hasDesecrated && (
        <section className="mt-10">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-6">
            <ModColumn
              title="Desecrated Präfixe"
              accent="desecrated"
              keyNs="d-pre"
              showProbability={false}
              groups={f.desPre}
              collapsedKeys={collapsedKeys}
              onToggle={toggleKey}
            />
            <ModColumn
              title="Desecrated Suffixe"
              accent="desecrated"
              keyNs="d-suf"
              showProbability={false}
              groups={f.desSuf}
              collapsedKeys={collapsedKeys}
              onToggle={toggleKey}
            />
          </div>
        </section>
      )}

      {/* Essence */}
      {hasEssence && (
        <section className="mt-10">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-6">
            <EssenceColumn
              title="Essence Präfixe"
              accent="essence"
              groups={f.essPre}
            />
            <EssenceColumn
              title="Essence Suffixe"
              accent="essence"
              groups={f.essSuf}
            />
          </div>
        </section>
      )}

      {/* Corrupted */}
      {hasCorrupted && (
        <section className="mt-10">
          <ModColumn
            title="Corrupted"
            accent="corrupted"
            keyNs="c"
            showProbability={false}
            groups={f.cor}
            collapsedKeys={collapsedKeys}
            onToggle={toggleKey}
          />
        </section>
      )}
    </div>
  )
}
