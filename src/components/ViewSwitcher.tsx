import { LayoutGrid, Table, BarChart3 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ModView = 'cards' | 'table' | 'bars'

const OPTIONS: { view: ModView; label: string; icon: LucideIcon }[] = [
  { view: 'cards', label: 'Karten', icon: LayoutGrid },
  { view: 'table', label: 'Tabelle', icon: Table },
  { view: 'bars', label: 'Balken', icon: BarChart3 },
]

/** Segment-Control zum Umschalten der Darstellung. */
export function ViewSwitcher({
  value,
  onChange,
}: {
  value: ModView
  onChange: (view: ModView) => void
}) {
  return (
    <div className="inline-flex rounded-md border border-border bg-surface-raised p-0.5">
      {OPTIONS.map(({ view, label, icon: Icon }) => {
        const active = view === value
        return (
          <button
            key={view}
            type="button"
            onClick={() => onChange(view)}
            aria-pressed={active}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-1.5 text-[12.5px] font-semibold transition-colors',
              active
                ? 'bg-accent text-heading'
                : 'text-secondary-text hover:text-body',
            )}
          >
            <Icon className="size-3.5" strokeWidth={2} aria-hidden />
            <span className="hidden sm:inline">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
