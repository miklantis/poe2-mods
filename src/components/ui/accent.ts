/**
 * Akzent einer Mod-Spalte. Bisher an den Slot (Praefix/Suffix) gekoppelt; mit
 * den Herkunft-Reitern kommt Corrupted als dritter, slot-loser Akzent dazu. Die
 * Klassen-Records bündeln die vorher in mehreren Komponenten verstreuten
 * Slot-Farben an einer Stelle.
 */
export type Accent = 'prefix' | 'suffix' | 'corrupted'

/** Punkt in der Spaltenüberschrift. */
export const ACCENT_DOT: Record<Accent, string> = {
  prefix: 'bg-prefix',
  suffix: 'bg-suffix',
  corrupted: 'bg-corrupted',
}

/** Überschrift und Zahlenwerte. */
export const ACCENT_TEXT: Record<Accent, string> = {
  prefix: 'text-prefix',
  suffix: 'text-suffix',
  corrupted: 'text-corrupted',
}

/** Tier-Badge (Rahmen/Fläche/Text). */
export const ACCENT_BADGE: Record<Accent, string> = {
  prefix: 'border-prefix/40 bg-prefix/10 text-prefix',
  suffix: 'border-suffix/40 bg-suffix/10 text-suffix',
  corrupted: 'border-corrupted/40 bg-corrupted/10 text-corrupted',
}

/** Füllung im Balken-View. */
export const ACCENT_FILL: Record<Accent, string> = {
  prefix: 'bg-prefix',
  suffix: 'bg-suffix',
  corrupted: 'bg-corrupted',
}
