# Designsystem – poe2-mods

Überblick über die UI-Bausteine und Design-Tokens. Quelle ist der Design-Handoff
(dunkles Theme). Die Tokens leben in `src/index.css`; dieses Dokument erklärt
Bedeutung und Verwendung. Bei Widerspruch gilt `src/index.css`.

## Theme

Das Theme ist fest dunkel, ohne Umschalter. Die semantischen shadcn-Tokens
(`background`, `foreground`, `card`, `border`, `primary`, `muted`, `accent`,
`ring`, ...) sind mit den dunklen Werten belegt, damit shadcn-Primitives ohne
Sonderbehandlung passen. Zusätzlich gibt es projektspezifische Tokens, die als
Tailwind-Utilities nutzbar sind.

## Farben

### Flächen
- App-Hintergrund `#0a0c0f` (`bg-background`) plus warmer Radial-Glow oben
  (auf `body`).
- Fläche/Karte `#0f1217` – `bg-surface` (auch `bg-card`).
- Fläche erhöht `#101318` – `bg-surface-raised` (Inputs, Kacheln, Segmente).
- Tabellen-Kopf `#12151a` – `bg-surface-header`.
- Gruppen-Kopf `#0c0f13` – `bg-surface-group`.

### Ränder
- Standard `#23272f` – `border-border` (Kacheln, Inputs).
- Karte/Tabelle `#20242c` – `border-border-card`.
- Dezent `#1a1e25` – `border-border-subtle` (innere Trenner).

### Text
- Überschrift (warmes Off-White) `#f3ead6` – `text-heading`.
- Fließtext `#e6e8ec` – `text-body` (auch `text-foreground`).
- Sekundär `#8b93a1` – `text-secondary-text` (Untertitel, Labels).
- Gedämpft `#6b7280` – `text-muted-text` (Spaltenköpfe, Meta).
- Dim/gesperrt `#565d68` – `text-dim` (gesperrte Tiers).

### Akzente Präfix/Suffix
- Präfix (Blau) `#6ea8ff` – `text-prefix` / `bg-prefix` (Spalte 1).
- Suffix (Gold) `#e8b45a` – `text-suffix` / `bg-suffix` (Spalte 2).
  Gold ist zugleich die Marken-/Primary-Farbe.

### Tag-Farben
`text-tag-*` / `bg-tag-*` für: caster `#8aa2ff`, fire `#e0663c`, cold `#4db4e0`,
lightning `#e6c94d`, physical `#b9c0cc`, chaos `#b06fd6`, attack `#d98a4d`,
life `#e05a6f`, mana `#4d8fe0`, resistance `#6fcf97`.
Aktive Filter-Pille: Text = Tag-Farbe, Hintergrund/Border als transparente
Variante der Farbe (Detail folgt mit der Facet-Search in Phase 4).

## Schriften

Self-hosted über `@fontsource-variable/*` (kein externes CDN, offline-tauglich),
importiert in `src/main.tsx`.

- Display/Überschriften: `font-display` – Space Grotesk (600/700).
- Fließtext/UI: `font-sans` – Manrope (Standard auf `body`).
- Numerisch: `font-mono` – JetBrains Mono, immer mit `tabular-nums` für
  Wertespalten (Rollen-Bereiche, Gewichte, Prozente, Itemstufe), damit Zahlen
  sauber untereinander stehen.

## Radien

`--radius` = `13px` als Basis; `rounded-lg` für Karten/Kacheln, `rounded-md` für
Inputs/Segmente, kleinere Werte für Tier-Badges. Pillen sind voll rund
(`rounded-full`).

## Bausteine (shadcn/ui)

Primitives werden bei Bedarf manuell unter `src/components/ui` angelegt (siehe
ADR 0002). Für die Item-Ansichten vorgesehen: Card, Table, Select, Slider, Badge,
Tabs, Input, Button, Separator, Collapsible. Icons über `lucide-react`.
