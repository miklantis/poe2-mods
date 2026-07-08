import { Search, X } from 'lucide-react'
import type { ColorTag } from '@/lib/modTags'
import { Input } from '@/components/ui/input'
import { TagFilterPill } from '@/components/ui/TagFilterPill'

/**
 * Filterleiste fuer Screen 2: Fuzzy-/Substring-Suche ueber den Mod-Text und
 * Tag-Pills (ODER). Die Itemstufe steht separat in der Kopfzeile
 * (`ItemLevelControl`). Der Zustand liegt oberhalb (URL) und wird nur
 * durchgereicht.
 */
export function FilterBar({
  search,
  onSearch,
  availableTags,
  activeTags,
  onToggleTag,
}: {
  search: string
  onSearch: (value: string) => void
  availableTags: readonly ColorTag[]
  activeTags: readonly string[]
  onToggleTag: (tag: ColorTag) => void
}) {
  const active = new Set(activeTags)
  return (
    <div className="mb-5 flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dim"
          aria-hidden
        />
        <Input
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Modifier durchsuchen …"
          aria-label="Modifier durchsuchen"
          className="pl-9"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearch('')}
            aria-label="Suche leeren"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-dim transition-colors hover:text-body"
          >
            <X className="size-4" aria-hidden />
          </button>
        )}
      </div>

      {availableTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {availableTags.map((t) => (
            <TagFilterPill
              key={t}
              tag={t}
              active={active.has(t)}
              onToggle={() => onToggleTag(t)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
