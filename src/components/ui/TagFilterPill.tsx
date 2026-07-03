import type { ColorTag } from '@/lib/modTags'
import { TAG_STYLE } from '@/components/ui/tagColors'
import { cn } from '@/lib/utils'

/** Klickbare Tag-Pille fuer den Facet-Filter. Aktiv farbig, inaktiv gedaempft. */
export function TagFilterPill({
  tag,
  active,
  onToggle,
}: {
  tag: ColorTag
  active: boolean
  onToggle: () => void
}) {
  const style = TAG_STYLE[tag]
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onToggle}
      className={cn(
        'rounded-full border px-2.5 py-1 text-[11.5px] font-semibold leading-none transition-colors',
        active
          ? style.cls
          : 'border-border bg-surface-raised text-secondary-text hover:text-body',
      )}
    >
      {style.label}
    </button>
  )
}
