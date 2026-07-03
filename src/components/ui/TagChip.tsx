import type { ColorTag } from '@/lib/modTags'
import { TAG_STYLE } from '@/components/ui/tagColors'

/** Farbiger Chip fuer einen Typ-Tag (Anzeige an der Mod-Familie). */
export function TagChip({ tag }: { tag: ColorTag }) {
  const style = TAG_STYLE[tag]
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-semibold leading-none ${style.cls}`}
    >
      {style.label}
    </span>
  )
}

/** Chip-Reihe fuer eine Mod-Familie; rendert nichts bei leerer Liste. */
export function TagChipRow({ tags }: { tags: readonly ColorTag[] }) {
  if (tags.length === 0) return null
  return (
    <span className="flex flex-wrap gap-1">
      {tags.map((t) => (
        <TagChip key={t} tag={t} />
      ))}
    </span>
  )
}
