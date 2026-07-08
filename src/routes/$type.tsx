import { useMemo } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'
import { z } from 'zod'
import { useItemTypes } from '@/hooks/useGameData'
import { buildItemGroups, resolveSlug } from '@/lib/itemGroups'
import { getIcon } from '@/lib/icons'
import { ModifierBrowser } from '@/components/ModifierBrowser'
import { ItemLevelControl } from '@/components/ItemLevelControl'

/**
 * URL-State fuer Screen 2: Variante, Darstellung, Itemstufe, aktive Tags und
 * Suche. `.catch` haelt kaputte Bookmarks robust auf sinnvollen Defaults.
 */
const searchSchema = z.object({
  v: z.string().optional(),
  ilvl: z.number().int().min(1).max(100).default(100).catch(100),
  tags: z.array(z.string()).default([]).catch([]),
  q: z.string().default('').catch(''),
})
export type BrowserSearch = z.infer<typeof searchSchema>

/** Frische Ansicht (Defaults) fuer Links auf die Browser-Route. */
export const DEFAULT_BROWSER_SEARCH: BrowserSearch = {
  ilvl: 100,
  tags: [],
  q: '',
}

export const Route = createFileRoute('/$type')({
  validateSearch: (search) => searchSchema.parse(search),
  component: BrowserPage,
})

function BrowserPage() {
  const { type } = Route.useParams()
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const itemTypes = useItemTypes()

  const patchSearch = (patch: Partial<BrowserSearch>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }) })

  const tile = useMemo(() => {
    for (const group of buildItemGroups(itemTypes.data ?? [])) {
      const found = group.types.find((t) => t.slug === type)
      if (found) return found
    }
    return undefined
  }, [itemTypes.data, type])

  const itemType = resolveSlug(itemTypes.data ?? [], type)

  return (
    <section className="mx-auto w-full max-w-[1240px] px-6 pt-7 pb-24">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-secondary-text transition-colors hover:text-heading"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Alle Item-Typen
      </Link>

      {itemTypes.error ? (
        <p className="mt-10 text-sm text-destructive">
          Daten konnten nicht geladen werden: {itemTypes.error.message}
        </p>
      ) : itemTypes.isPending ? (
        <p className="mt-10 text-sm text-secondary-text">Lade Daten …</p>
      ) : !itemType ? (
        <p className="mt-10 text-sm text-secondary-text">
          Unbekannter Item-Typ „{type}".
        </p>
      ) : (
        <>
          <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6">
            <div className="flex items-center gap-4">
              <span className="flex size-12 items-center justify-center rounded-lg border border-border bg-surface-raised">
                {(() => {
                  const Icon = getIcon(tile?.iconKey ?? 'box')
                  return (
                    <Icon
                      className="size-6 text-suffix"
                      strokeWidth={1.5}
                      aria-hidden
                    />
                  )
                })()}
              </span>
              <h1 className="font-display text-[28px] font-bold tracking-[-0.02em] text-heading">
                {itemType.name}
              </h1>
            </div>

            <ItemLevelControl
              itemLevel={search.ilvl}
              onItemLevel={(ilvl) => patchSearch({ ilvl })}
            />
          </div>

          <ModifierBrowser
            itemType={itemType}
            search={search}
            patchSearch={patchSearch}
          />
        </>
      )}
    </section>
  )
}
