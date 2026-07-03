# PLAN – poe2-mods

## Aktueller Stand

Phase 0 (Setup) umgesetzt. Das Grundgerüst steht: React 19 + Vite,
TypeScript strict, TanStack Router und Query, Tailwind v4 mit shadcn-Basis,
Zod und Vitest installiert. Deploy-Pipeline über GitHub Actions auf GitHub
Pages inkl. SPA-Fallback. Changelog (0.1.0) und Docs-Struktur angelegt.

Als Nächstes: Phase 1 – Datenpipeline und Schema. Startpunkt ist die
Konzept-Abstimmung zum Ziel-Schema (welche Felder aus dem repoe-fork-Export
wir übernehmen) und wie wir Item-Typen/Groupings aus `item_classes` und `tags`
ableiten.

Hinweis Betrieb: Die Pages-Quelle im Repo muss einmalig auf „GitHub Actions"
stehen (Settings → Pages → Source), sonst greift der Deploy nicht.

---

## Offene Vorhaben

### Phase 1 – Datenpipeline und Schema
- [ ] Ziel-Schema festlegen: `mods`, `base_items`, `tags`, `mod_types` (nur benötigte Felder)
- [ ] Zod-Schemas als Quelle der Wahrheit, TS-Typen ableiten
- [ ] Import-Skript: repoe-fork-Export → normalisiertes Schema
- [ ] Daten unter `data/<spielversion>/` ablegen, `data/manifest.json` mit aktueller Version
- [ ] Loader-Hooks (`useManifest`, `useMods`, `useBaseItems`, `useTags`) über TanStack Query
- [ ] Zod-Validierung beim Laden

### Phase 2 – Query-Engine (reines Modul)
- [ ] Filter: Domain, Slot (Präfix/Suffix), Itemstufe, Tag-Gewicht > 0
- [ ] Dedup nach Mod-Group, Sortierung nach Tier
- [ ] Gewichte → Wahrscheinlichkeiten
- [ ] Unit-Tests (Vitest)

### Phase 3 – UI-Grundgerüst
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

---

## Log

- 2026-07-03, 0.1.0 – Phase 0 (Setup) abgeschlossen. Grundgerüst, Routing,
  Styling, Deploy-Pipeline und Docs-Struktur stehen; Basis für die Datenpipeline gelegt.
