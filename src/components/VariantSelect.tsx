import type { BaseVariant } from '@/lib/baseVariants'
import { cn } from '@/lib/utils'

/**
 * Umschalter fuer die Basis-Varianten eines Item-Typs. Wird nur gerendert, wenn
 * es mehr als eine Variante gibt (Aufruferseite entscheidet). Pill-Reihe, die
 * auf schmalen Screens umbricht.
 */
export function VariantSelect({
  variants,
  selectedId,
  onSelect,
}: {
  variants: readonly BaseVariant[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  return (
    <div
      role="tablist"
      aria-label="Basis-Variante"
      className="flex flex-wrap gap-2"
    >
      {variants.map((v) => {
        const active = v.id === selectedId
        return (
          <button
            key={v.id}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onSelect(v.id)}
            title={`z. B. ${v.sampleBase}`}
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
