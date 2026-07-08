import { Slider } from '@/components/ui/Slider'

/** Grenzen der Itemstufe (deckungsgleich mit dem URL-Schema in `$type`). */
export const MIN_ITEM_LEVEL = 1
export const MAX_ITEM_LEVEL = 100

/**
 * Itemstufen-Regler: Info-Label und Slider mit Min/Max-Ticks. Steht in der
 * Kopfzeile neben dem Item-Namen, nicht mehr in der Filterleiste. Label und
 * Slider haben bewusst Abstand (`gap-5`), damit die Zahl nicht am Regler klebt.
 * Zustand liegt oberhalb (URL) und wird nur durchgereicht.
 */
export function ItemLevelControl({
  itemLevel,
  min = MIN_ITEM_LEVEL,
  max = MAX_ITEM_LEVEL,
  onItemLevel,
}: {
  itemLevel: number
  min?: number
  max?: number
  onItemLevel: (value: number) => void
}) {
  return (
    <div className="flex items-center gap-5">
      <span className="shrink-0 text-[13px] text-secondary-text">
        Itemstufe{' '}
        <span className="font-mono tabular-nums text-body">{itemLevel}</span>
      </span>
      <div className="w-full min-w-[180px] max-w-[260px]">
        <Slider
          value={itemLevel}
          min={min}
          max={max}
          onChange={onItemLevel}
          aria-label="Itemstufe"
        />
        <div className="mt-0.5 flex justify-between font-mono text-[10.5px] tabular-nums text-dim">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>
    </div>
  )
}
