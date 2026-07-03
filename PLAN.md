# PLAN – poe2-mods

## Aktueller Stand

Phase 0 (Setup) und Phase 1 (Datenpipeline und Schema) umgesetzt. Die App lädt
die normalisierten Spieldaten (Version 4.5.4.3) über TanStack Query, validiert
sie beim Laden gegen die Zod-Schemas und zeigt einen Datenstatus auf der
Startseite (Version, Anzahl Mods/Basen/Item-Typen/Tags).

Datenpipeline: `scripts/import.ts` zieht den poe2-Export von `repoe-fork/poe2`,
slimt ihn aufs Schema, validiert und legt ihn unter `data/4.5.4.3/` ab;
`data/manifest.json` zeigt auf die aktive Version. Ergebnis rund 1,5 MB, gegen
poe2db an den Ringen gegengeprüft (203 rollbare Mods).

Als Nächstes: Phase 2 – Query-Engine (reines, testbares Modul): Tier aus der
Gruppen-Rangfolge, Wahrscheinlichkeit aus den Gewichten, Filter und Dedup. Das
besprechen wir per Konzept-vor-Code, bevor gebaut wird.

Hinweis: Das UI-Design aus der poe2db-Vorlage soll in Claude Design prototypt
und vor Phase 3 (UI-Grundgerüst) eingearbeitet werden.

---

## Offene Vorhaben

### Phase 2 – Query-Engine (reines Modul)
- [ ] Filter: Domain, Slot (Präfix/Suffix), Itemstufe, Tag-Gewicht > 0
- [ ] Dedup nach Mod-Group, Sortierung nach Tier
- [ ] Gewichte → Wahrscheinlichkeiten
- [ ] Unit-Tests (Vitest)

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

---

## Log

- 2026-07-03, 0.2.0 – Phase 1 (Datenpipeline und Schema) abgeschlossen. Zod-Schema,
  Import-Skript, normalisierte Daten (4.5.4.3), Loader-Hooks mit Validierung und
  Datenstatus-Anzeige. An den Ringen gegen poe2db gegengeprüft.
- 2026-07-03, 0.1.0 – Phase 0 (Setup) abgeschlossen. Grundgerüst, Routing,
  Styling, Deploy-Pipeline und Docs-Struktur stehen; Basis für die Datenpipeline gelegt.
