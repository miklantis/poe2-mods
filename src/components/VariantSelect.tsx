import type { Variant } from '@/data/schema.coe'
import { cn } from '@/lib/utils'

/**
 * Umschalter fuer die Basis-Varianten eines Item-Typs. Wird nur gerendert, wenn
 * es mehr als eine Variante gibt (Aufruferseite entscheidet). Pill-Reihe, die
 * auf schmalen Screens umbricht. Die Auswahl laeuft ueber die Basis-Id.
 */
export function VariantSelect({
  variants,
  selectedBase,
  onSelect,
}: {
  variants: readonly Variant[]
  selectedBase: string
  onSelect: (base: string) => void
}) {
  return (
    <div
      role="tablist"
      aria-label="Basis-Variante"
      className="flex flex-wrap gap-2"
    >
      {variants.map((v) => {
        const active = v.base === selectedBase
        return (
          <button
            key={v.base}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onSelect(v.base)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors',
              active
                ? 'border-suffix bg-accent text-heading'
                : 'border-border bg-surface-raised text-secondary-text hover:border-suffix/60 hover:text-body',
            )}
          >
            {v.label}
          </button>
        )
      })}
    </div>
  )
}
