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

Als Nächstes: Phase 3 – UI-Grundgerüst. Vorher das UI-Design aus der
poe2db-Vorlage in Claude Design prototypen und einarbeiten. Vorbild ist die
ModifiersCalc-Ansicht (Item Level, Präfix/Suffix, Tier- und Prozentspalten),
mit schlichter, moderner Oberfläche. Das besprechen wir per Konzept-vor-Code.

---

## Offene Vorhaben

### Phase 3 – UI-Grundgerüst
- [ ] Design-Vorlage aus Claude Design einarbeiten (vor dem Ausbau)
- [ ] Routen je Item-Typ (`/rings`, `/amulets`, …)
- [ ] Mod-Tabelle: Präfix/Suffix getrennt, Tier, Rollen-Bereich, Gewicht
- [ ] Basis- und Unique-Ansicht je Item-Typ

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

- 2026-07-03, 0.3.0 – Phase 2 (Query-Engine) abgeschlossen. Reines Modul
  `src/lib/query/engine.ts`: Eignung nach „erster passender Tag gewinnt", Tier je
  Gruppe plus Slot, Itemstufen-Filter, Wahrscheinlichkeit pro Slot. 11 Unit-Tests.
- 2026-07-03, 0.2.0 – Phase 1 (Datenpipeline und Schema) abgeschlossen. Zod-Schema,
  Import-Skript, normalisierte Daten (4.5.4.3), Loader-Hooks mit Validierung und
  Datenstatus-Anzeige. An den Ringen gegen poe2db gegengeprüft.
- 2026-07-03, 0.1.0 – Phase 0 (Setup) abgeschlossen. Grundgerüst, Routing,
  Styling, Deploy-Pipeline und Docs-Struktur stehen; Basis für die Datenpipeline gelegt.
