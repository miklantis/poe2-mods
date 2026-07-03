/** Formatiert einen Anteil (0..1) als Prozent mit sinnvoller Genauigkeit. */
export function formatPercent(value: number): string {
  const pct = value * 100
  const digits = pct < 0.1 ? 3 : pct < 10 ? 2 : 1
  return `${Number(pct.toFixed(digits))}%`
}

/** Formatiert ein Spawn-Gewicht als ganze Zahl mit Tausendertrennung. */
export function formatWeight(value: number): string {
  return Math.round(value).toLocaleString('de-DE')
}
