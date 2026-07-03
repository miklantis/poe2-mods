/**
 * Schlanker Slider auf Basis eines nativen Range-Inputs (keine Radix-
 * Abhaengigkeit). Die Akzentfarbe kommt aus dem Suffix-/Marken-Token.
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
  return (
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-raised accent-suffix"
    />
  )
}
