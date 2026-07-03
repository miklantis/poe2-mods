import { useMemo, useState } from 'react'
import type { BaseItem, ItemType, Mod } from '@/data/schema.repoe'
import type { BrowserSearch } from '@/routes/$type'
import { useMods, useBaseItems, useEssences } from '@/hooks/useGameData'
import { runRepoeQuery, essenceGroups } from '@/lib/query/repoeEngine'
import type { RepoeGroup } from '@/lib/query/repoeEngine'
import { filterGroups, availableTags } from '@/lib/query/filter'
import type { ColorTag } from '@/lib/modTags'
import { VariantSelect } from '@/components/VariantSelect'
import { ModColumn } from '@/components/ModColumn'
import { EssenceColumn } from '@/components/EssenceColumn'
import { FilterBar } from '@/components/FilterBar'

const MIN_ITEM_LEVEL = 1
const MAX_ITEM_LEVEL = 100

const prefixesOf = (groups: RepoeGroup[]) =>
  groups.filter((g) => g.slot === 'prefix')
const suffixesOf = (groups: RepoeGroup[]) =>
  groups.filter((g) => g.slot === 'suffix')

/**
 * Modifier-Browser je Item-Typ (Screen 2). Alle Herkünfte gleichzeitig, ohne
 * Umschalten: oben der rollbare Pool (Präfixe blau, Suffixe gelb), darunter
 * Desecrated (grün), dann Essence (violett, je Mod eine Zeile mit Bereich) und
 * ganz unten Corrupted (rot). Datenquelle repoe: nur binäre Spawn-Gewichte,
 * daher keine Chance – alle Herkünfte einheitlich mit Tier und Wertebereich.
 * Ein gemeinsamer Filter (Suche, Tags, Itemstufe) wirkt auf alle Abschnitte;
 * Filterzustand liegt im URL-State, nur das Ein-/Ausklappen ist lokal. Query-
 * und Filter-Logik bleiben in den reinen Modulen.
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
  const essences = useEssences()

  const variants = itemType.variants
  const selected =
    variants.find((v) => v.base === search.v) ?? variants[0] ?? null

  const [expandedKeys, setExpandedKeys] = useState<ReadonlySet<string>>(
    new Set(),
  )

  const baseById = useMemo(() => {
    const map = new Map<string, BaseItem>()
    for (const b of baseItems.data ?? []) map.set(b.id, b)
    return map
  }, [baseItems.data])

  const base = selected ? baseById.get(selected.base) : undefined
  const baseTags = base?.tags ?? []
  const itemClass = base?.itemClass

  // Rohe Gruppen je Herkunft (vor dem Suchfilter, nach Itemstufe).
  const raw = useMemo(() => {
    const allMods: Mod[] = mods.data ?? []
    const ctx = { itemLevel: search.ilvl }
    const roll = runRepoeQuery(allMods, baseTags, 'rollable', ctx)
    const des = runRepoeQuery(allMods, baseTags, 'desecrated', ctx)
    const cor = runRepoeQuery(allMods, baseTags, 'corrupted', ctx)
    const essList =
      essences.data && itemClass ? (essences.data[itemClass] ?? []) : []
    const ess = essenceGroups(essList, ctx)
    return { roll, des, cor, ess }
  }, [mods.data, essences.data, baseTags, itemClass, search.ilvl])

  const hasDesecrated = raw.des.length > 0
  const hasEssence = raw.ess.length > 0
  const hasCorrupted = raw.cor.length > 0

  const tags = useMemo(
    () => availableTags([...raw.roll, ...raw.des, ...raw.cor]),
    [raw],
  )

  // Suchfilter auf jede Liste anwenden.
  const f = useMemo(() => {
    const c = { tags: search.tags, search: search.q }
    return {
      rollPre: filterGroups(prefixesOf(raw.roll), c),
      rollSuf: filterGroups(suffixesOf(raw.roll), c),
      desPre: filterGroups(prefixesOf(raw.des), c),
      desSuf: filterGroups(suffixesOf(raw.des), c),
      essPre: filterGroups(prefixesOf(raw.ess), c),
      essSuf: filterGroups(suffixesOf(raw.ess), c),
      cor: filterGroups(raw.cor, c),
    }
  }, [raw, search.tags, search.q])

  const allKeys = useMemo(
    () => [
      ...f.rollPre.map((g) => `r-pre-${g.id}`),
      ...f.rollSuf.map((g) => `r-suf-${g.id}`),
      ...f.desPre.map((g) => `d-pre-${g.id}`),
      ...f.desSuf.map((g) => `d-suf-${g.id}`),
      ...f.cor.map((g) => `c-${g.id}`),
    ],
    [f],
  )

  const collapsedKeys = useMemo(() => {
    const s = new Set<string>()
    for (const k of allKeys) if (!expandedKeys.has(k)) s.add(k)
    return s
  }, [allKeys, expandedKeys])

  const toggleKey = (key: string) =>
    setExpandedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const toggleTag = (tag: ColorTag) => {
    const active = new Set(search.tags)
    if (active.has(tag)) active.delete(tag)
    else active.add(tag)
    patchSearch({ tags: [...active] })
  }

  const isPending = mods.isPending || baseItems.isPending || essences.isPending
  const error = mods.error ?? baseItems.error ?? essences.error

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

      <p className="mb-6 text-[12px] text-dim">
        Modifier aus den Spieldaten (repoe). repoe führt nur binäre
        Spawn-Gewichte, daher keine Chance – alle Herkünfte mit Tier und
        Wertebereich.
      </p>

      {/* Rollbar */}
      <section>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-6">
          <ModColumn
            title="Präfixe"
            accent="prefix"
            keyNs="r-pre"
            groups={f.rollPre}
            collapsedKeys={collapsedKeys}
            onToggle={toggleKey}
          />
          <ModColumn
            title="Suffixe"
            accent="suffix"
            keyNs="r-suf"
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
              groups={f.desPre}
              collapsedKeys={collapsedKeys}
              onToggle={toggleKey}
            />
            <ModColumn
              title="Desecrated Suffixe"
              accent="desecrated"
              keyNs="d-suf"
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
            groups={f.cor}
            collapsedKeys={collapsedKeys}
            onToggle={toggleKey}
          />
        </section>
      )}
    </div>
  )
}
