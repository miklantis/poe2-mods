import { useMemo } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'
import { useItemTypes } from '@/hooks/useGameData'
import { buildItemGroups, resolveSlug } from '@/lib/itemGroups'
import { getIcon } from '@/lib/icons'

export const Route = createFileRoute('/$type')({
  component: BrowserPage,
})

function BrowserPage() {
  const { type } = Route.useParams()
  const itemTypes = useItemTypes()

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
          <div className="mt-6 flex items-center gap-4">
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
          <p className="mt-6 text-sm text-secondary-text">
            Der Modifier-Browser für diesen Item-Typ folgt im nächsten Schritt.
          </p>
        </>
      )}
    </section>
  )
}
