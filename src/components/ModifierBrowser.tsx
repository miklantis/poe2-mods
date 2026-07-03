import { useMemo, useState } from 'react'
import type { ItemType } from '@/data/schema'
import { useMods, useBaseItems } from '@/hooks/useGameData'
import { deriveVariants } from '@/lib/baseVariants'
import { runQuery } from '@/lib/query/engine'
import { VariantSelect } from '@/components/VariantSelect'
import { ModColumn } from '@/components/ModColumn'

/** Feste Itemstufe, bis der Slider (Phase 4) sie steuerbar macht. */
const DEFAULT_ITEM_LEVEL = 100

/**
 * Modifier-Browser je Item-Typ (Screen 2). Leitet die Basis-Varianten aus den
 * Daten ab, laesst zwischen ihnen umschalten und zeigt Praefixe und Suffixe
 * getrennt. Die Query-Logik bleibt im reinen Modul `runQuery`.
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

  const result = useMemo(() => {
    if (!mods.data || !selected) return null
    return runQuery(mods.data, {
      tags: selected.tags,
      itemLevel: DEFAULT_ITEM_LEVEL,
    })
  }, [mods.data, selected])

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

      <p className="mb-5 text-[13px] text-secondary-text">
        Itemstufe{' '}
        <span className="font-mono tabular-nums text-body">
          {DEFAULT_ITEM_LEVEL}
        </span>{' '}
        · voller Pool. Rollen-Bereiche, Gewichte und Chancen je Tier.
      </p>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-6">
        <ModColumn slot="prefix" groups={result.prefixes} />
        <ModColumn slot="suffix" groups={result.suffixes} />
      </div>
    </div>
  )
}
