# PLAN – poe2-mods

## Aktueller Stand

Phase 0 (Setup), Phase 1 (Datenpipeline und Schema) und Phase 2 (Query-Engine)
umgesetzt. Die App lädt die normalisierten Spieldaten (Version 4.5.4.3) über
TanStack Query, validiert sie beim Laden gegen die Zod-Schemas und zeigt einen
Datenstatus auf der Startseite.

Datenpipeline: `scripts/import.ts` zieht den poe2-Export von `repoe-fork/poe2`,
slimt ihn aufs Schema, validiert und legt ihn unter `data/4.5.4.3/` ab;
`data/manifest.json` zeigt auf die aktive Version. An den Ringen gegen poe2db
gegengeprüft (203 rollbare Mods).

Query-Engine (`src/lib/query/engine.ts`): reines, DOM-freies Modul. `runQuery`
nimmt Item-Tags plus Itemstufe und liefert Präfixe und Suffixe je Gruppe mit
Tier und Wahrscheinlichkeit. Regeln: Eignung nach „erster passender Tag
gewinnt", Tier als stabile Rangfolge je Gruppe plus Slot (requiredLevel
absteigend), Itemstufe filtert den Pool, Wahrscheinlichkeit pro Slot über den
erreichbaren Rest. 11 Unit-Tests (Vitest).

Phase 3 (UI-Grundgerüst) läuft. Design-Fundament und Screen 1 stehen: das
dunkle Theme aus dem Handoff ist als Design-System eingezogen (Farb- und
Text-Tokens, Präfix-/Suffix- und Tag-Farben, drei self-hosted Schriften,
Hintergrund-Glow, schlanke Layout-Shell). Die Startseite ist die
Item-Typ-Auswahl: alle Typen als Kacheln, nach Kategorien gruppiert, mit Suche;
ein Klick navigiert auf die Browser-Route je Typ (`/$type`, aktuell noch
Platzhalter). Doku in `docs/Designsystem.md`.

Die Gruppierung leitet sich aus den Daten ab: eine Config in
`src/lib/itemGroups.ts` liefert Reihenfolge, Anzeigenamen und Icons, die
tatsächlichen Typen kommen aus den geladenen Daten, Unbekanntes fällt nach
„Other". Grouping-Entscheidungen: `Warstaff` zeigt „Quarterstaff",
`FishingRod`/`TrapTool` laufen unter „Other".

Als Nächstes in Phase 3: Screen 2 (Modifier-Browser je Item-Typ) auf Basis von
`runQuery`, danach dessen Feinschliff (Tag-Highlight, View-Switcher,
Collapse-all).

---

## Offene Vorhaben

### Phase 3 – UI-Grundgerüst
- [x] Design-Vorlage einarbeiten (Design-System: Tokens, Schriften, Layout-Shell)
- [x] Screen 1: Item-Typ-Auswahl (gruppiertes Kachel-Grid, Suche, Navigation)
- [ ] Screen 2: Modifier-Browser (Präfix/Suffix getrennt, Tier, Rollen-Bereich, Gewicht/Wahrscheinlichkeit)
- [ ] Screen-2-Feinschliff (Tag-Highlight, View-Switcher Cards/Table/Bars, Collapse-all)
- [ ] Basis-Varianten-Selektor (Str/Dex/Int) und Unique-Ansicht – Datenlage klären

### Phase 4 – Facet-Search
- [ ] Tag-Pills (Caster, Fire, Cold, Lightning, …)
- [ ] Slider für Itemstufe mit Live-Neuberechnung
- [ ] Fuzzy-Suche über Mod-Text
- [ ] Filter-Zustand als URL-State (teil- und bookmarkbar)

### Phase 5 – optional/später
- [ ] PWA-Hülle (`vite-plugin-pwa`), Offline-Feinschliff
- [ ] Feinschliff Design/Designsystem
- [ ] `docs/Referenz.md` (Kategorie-Liste, Notizen je poe2db-Ansicht)

---

## Abgeschlossene Vorhaben

### Phase 0 – Setup
- [x] Vite + React 19 + TypeScript (strict) aufsetzen
- [x] Tailwind v4 einrichten
- [x] shadcn/ui initialisieren (Primitives in `src/components/ui`)
- [x] TanStack Router (file-based) + TanStack Query einbinden
- [x] Vite `base` auf `/poe2-mods/` setzen, SPA-Fallback für Pages
- [x] GitHub-Actions-Workflow für Build + Deploy auf GitHub Pages
- [x] `public/changelog.json` anlegen (Startversion 0.1.0)
- [x] `docs/Architektur.md`, `docs/adr/` und `docs/archive/` anlegen

### Phase 1 – Datenpipeline und Schema
- [x] Ziel-Schema festlegen: `mods`, `base_items`, `tags`, `item_types` (nur benötigte Felder)
- [x] Zod-Schemas als Quelle der Wahrheit, TS-Typen ableiten
- [x] Import-Skript: repoe-fork-Export → normalisiertes Schema
- [x] Daten unter `data/<spielversion>/` ablegen, `data/manifest.json` mit aktueller Version
- [x] Loader-Hooks (`useManifest`, `useMods`, `useBaseItems`, `useItemTypes`, `useTags`) über TanStack Query
- [x] Zod-Validierung beim Laden

### Phase 2 – Query-Engine (reines Modul)
- [x] Filter: Domain (Item-Tags), Slot (Präfix/Suffix), Itemstufe, Tag-Gewicht > 0
- [x] Dedup nach Mod-Group, Sortierung nach Tier
- [x] Gewichte → Wahrscheinlichkeiten (pro Slot, über erreichbaren Pool)
- [x] Unit-Tests (Vitest)

---

## Log

- 2026-07-03, 0.5.0 – Phase 3, Screen 1: Item-Typ-Auswahl. Gruppiertes
  Kachel-Grid aus den Daten (Config in `itemGroups.ts` liefert Reihenfolge,
  Labels und Icons; Unbekanntes fällt nach „Other"), Substring-Suche,
  Navigation auf die Browser-Route `/$type` (noch Platzhalter). Reine
  Gruppierungslogik mit 6 Tests. Input-Primitive und `ItemTypeTile` als
  wiederverwendbare Bausteine.
- 2026-07-03, 0.4.0 – Phase 3 gestartet: Design-System eingezogen. Dunkles Theme
  aus dem Handoff als Tokens (Farben, Text-Abstufungen, Präfix-/Suffix- und
  Tag-Farben), drei self-hosted Schriften (Space Grotesk, Manrope, JetBrains
  Mono), Hintergrund-Glow, schlanke Layout-Shell ohne globalen Header. Grundlage
  für die Item-Ansichten.
- 2026-07-03, 0.3.0 – Phase 2 (Query-Engine) abgeschlossen. Reines Modul
  `src/lib/query/engine.ts`: Eignung nach „erster passender Tag gewinnt", Tier je
  Gruppe plus Slot, Itemstufen-Filter, Wahrscheinlichkeit pro Slot. 11 Unit-Tests.
- 2026-07-03, 0.2.0 – Phase 1 (Datenpipeline und Schema) abgeschlossen. Zod-Schema,
  Import-Skript, normalisierte Daten (4.5.4.3), Loader-Hooks mit Validierung und
  Datenstatus-Anzeige. An den Ringen gegen poe2db gegengeprüft.
- 2026-07-03, 0.1.0 – Phase 0 (Setup) abgeschlossen. Grundgerüst, Routing,
  Styling, Deploy-Pipeline und Docs-Struktur stehen; Basis für die Datenpipeline gelegt.
