/**
 * Akzent (Farbe) einer Mod-Tabelle. An die Herkunft gekoppelt: Präfix/Suffix des
 * rollbaren Pools tragen die klassischen Slot-Farben, Desecrated ist durchgehend
 * grün, Corrupted rot. Zentral gebündelt, damit die Farben nicht über mehrere
 * Komponenten verstreut liegen.
 */
export type Accent = 'prefix' | 'suffix' | 'desecrated' | 'corrupted'

/** Punkt in der Spaltenüberschrift. */
export const ACCENT_DOT: Record<Accent, string> = {
  prefix: 'bg-prefix',
  suffix: 'bg-suffix',
  desecrated: 'bg-desecrated',
  corrupted: 'bg-corrupted',
}

/** Überschrift und Zahlenwerte. */
export const ACCENT_TEXT: Record<Accent, string> = {
  prefix: 'text-prefix',
  suffix: 'text-suffix',
  desecrated: 'text-desecrated',
  corrupted: 'text-corrupted',
}
