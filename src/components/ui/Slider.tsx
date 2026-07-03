import type { CSSProperties } from 'react'

/**
 * Schlanker Slider auf Basis eines nativen Range-Inputs (keine Radix-
 * Abhaengigkeit). Die sichtbare Schiene, der bis zum Wert gefuellte Bereich und
 * der Regler-Punkt kommen aus der Klasse `.il-slider` (src/index.css). Der
 * gefuellte Anteil wird fuer WebKit ueber die CSS-Variable `--il-pct` gesetzt.
 */
export function Slider({
  value,
  min,
  max,
  onChange,
  'aria-label': ariaLabel,
}: {
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  'aria-label'?: string
}) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0
  return (
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => onChange(Number(e.target.value))}
      className="il-slider"
      style={{ '--il-pct': `${pct}%` } as CSSProperties}
    />
  )
}
