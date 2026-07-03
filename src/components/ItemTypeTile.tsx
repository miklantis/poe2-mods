import { Link } from '@tanstack/react-router'
import { getIcon } from '@/lib/icons'
import type { TileView } from '@/lib/itemGroups'

/**
 * Kachel fuer einen Item-Typ auf Screen 1. Verlinkt auf die Browser-Route und
 * scrollt beim Wechsel nach oben.
 */
export function ItemTypeTile({ tile }: { tile: TileView }) {
  const Icon = getIcon(tile.iconKey)
  return (
    <Link
      to="/$type"
      params={{ type: tile.slug }}
      className="group flex flex-col items-center gap-2 rounded-lg border border-border bg-surface-raised px-2.5 py-[19px] text-center transition-all hover:-translate-y-0.5 hover:border-suffix hover:bg-accent"
    >
      <Icon
        className="size-[26px] text-secondary-text transition-colors group-hover:text-heading"
        strokeWidth={1.5}
        aria-hidden
      />
      <span className="text-[12.5px] font-semibold text-body transition-colors group-hover:text-heading">
        {tile.label}
      </span>
    </Link>
  )
}
