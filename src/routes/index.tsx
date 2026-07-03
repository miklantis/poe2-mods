import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Gem, Search } from 'lucide-react'
import { useItemTypes } from '@/hooks/useGameData'
import { buildItemGroups } from '@/lib/itemGroups'
import { ItemTypeTile } from '@/components/ItemTypeTile'
import { Input } from '@/components/ui/input'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const itemTypes = useItemTypes()
  const [query, setQuery] = useState('')

  const groups = useMemo(
    () => buildItemGroups(itemTypes.data ?? []),
    [itemTypes.data],
  )

  const q = query.trim().toLowerCase()
  const filtered = useMemo(() => {
    if (!q) return groups
    return groups
      .map((g) => ({
        ...g,
        types: g.types.filter((t) => t.label.toLowerCase().includes(q)),
      }))
      .filter((g) => g.types.length > 0)
  }, [groups, q])

  return (
    <section className="mx-auto w-full max-w-[1120px] px-6 pt-[54px] pb-24">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-md border border-border bg-surface-raised">
          <Gem className="size-5 text-suffix" strokeWidth={1.5} aria-hidden />
        </span>
        <span className="font-display text-[22px] font-bold tracking-[-0.01em] text-heading">
          poe2-mods
        </span>
      </div>

      <p className="mt-3 max-w-prose text-secondary-text">
        Durchsuchbarer Modifier-Browser für Path of Exile 2. Wähle einen
        Item-Typ, um seine möglichen Modifier, Tier und Spawn-Gewichte
        durchzusehen.
      </p>

      <div className="relative mt-6 max-w-[520px]">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dim"
          aria-hidden
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Item-Typ suchen …"
          aria-label="Item-Typ suchen"
          className="pl-9"
        />
      </div>

      {itemTypes.error ? (
        <p className="mt-10 text-sm text-destructive">
          Daten konnten nicht geladen oder nicht validiert werden:{' '}
          {itemTypes.error.message}
        </p>
      ) : itemTypes.isPending ? (
        <p className="mt-10 text-sm text-secondary-text">Lade Item-Typen …</p>
      ) : filtered.length === 0 ? (
        <p className="mt-10 text-sm text-secondary-text">
          Keine Item-Typen passen zu „{query.trim()}".
        </p>
      ) : (
        <div className="mt-10 space-y-9">
          {filtered.map((group) => (
            <div key={group.label}>
              <h2 className="mb-3 border-b border-border-subtle pb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-text">
                {group.label}
              </h2>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-3">
                {group.types.map((tile) => (
                  <ItemTypeTile key={tile.id} tile={tile} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
