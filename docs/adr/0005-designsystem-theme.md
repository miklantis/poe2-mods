# ADR 0005 – Design-System: festes dunkles Theme, self-hosted Schriften

Status: akzeptiert
Datum: 2026-07-03

## Kontext

Für Phase 3 (UI-Grundgerüst) liegt ein detaillierter Design-Handoff vor (dunkles
Theme, exakte Farben, Schriften, Radien). Er muss in unseren Stack (Tailwind v4,
shadcn/ui) übersetzt werden. Zwei Punkte waren zu entscheiden: Umgang mit hell/
dunkel und die Herkunft der Schriften.

## Entscheidung

- Das Theme ist fest dunkel, ohne Umschalter. Die shadcn-Standard-Tokens werden
  direkt mit den dunklen Handoff-Werten belegt (kein separater Light-Block, keine
  `.dark`-Klasse als Voraussetzung). Projektspezifische Tokens (Präfix-/Suffix-
  Akzent, Tag-Farben, Surface- und Text-Abstufungen) liegen zusätzlich im
  `@theme`-Block und sind damit als Tailwind-Utilities verfügbar.
- Die drei Schriften (Space Grotesk, Manrope, JetBrains Mono) werden self-hosted
  über `@fontsource-variable/*` gebündelt statt vom Google-Fonts-CDN geladen.

## Konsequenzen

- Kein Light-Theme; falls später gewünscht, müsste ein zweiter Token-Satz plus
  Umschalter ergänzt werden.
- Schriften funktionieren offline und ohne Drittanbieter-Request, passend zum
  späteren PWA-Ziel. Der Build erzeugt mehrere Sprach-Subsets als woff2; der
  Browser lädt per `unicode-range` nur die tatsächlich benötigten (Latin).
- `noUncheckedSideEffectImports` verlangt eine Typdeklaration für die CSS-Imports
  der Font-Pakete; sie liegt in `src/fontsource.d.ts`.
- Der globale Header aus dem Setup entfällt; die Marke ist Teil von Screen 1.
