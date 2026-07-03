# PLAN – poe2-mods

## Aktueller Stand

Phase 6 (Datenquelle Craft of Exile) läuft, Schritt 1 ist umgesetzt. Grund für
den Umbau: repoe-fork und der PoB-Export enthalten keine echten Spawn-Gewichte
(alle Werte 1), PoE2 legt sie nicht offen; CoE rekonstruiert sie (Schätzwerte).

Schritt 1 (erledigt): `scripts/import-coe.ts` (`npm run import:coe`) verarbeitet
den versionierten CoE-Snapshot unter `data/_source/coe/` zu einem
basis-zentrierten Schema unter `data/0.5.4/` (`item_types.json` mit Varianten,
`mods.json` mit Text/Slot/Gruppe/Tags, `base_mods.json` mit je Basis den Tiers:
Itemstufe, Gewicht, Rollen-Bereiche). Zod-validiert im Import, an den Ringen
gegengeprüft (variable Gewichte). Der Import ist allein aus dem Repo
reproduzierbar (kein Abruf, keine Uploads nötig).

Wichtig für die nächste Sitzung: `data/manifest.json` zeigt noch auf die alte
repoe-Version `4.5.4.3`, die App läuft unverändert auf den alten Daten und dem
alten Schema (`src/data/schema.ts`). Erst Schritt 3 stellt die App auf das neue
Schema und das Manifest auf `0.5.4` um. Als Nächstes: **Schritt 2** – die
Query-Engine auf die Basis-Gewichte umstellen (pro Basis Tiers →
Wahrscheinlichkeit, Ausgabe-Formen `ModGroup`/`ComputedMod` beibehalten) mit
Unit-Tests, ohne die App-Verdrahtung anzufassen.

--- Stand vor Phase 6 (weiter gültig für die Oberfläche): ---

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

Phase 3 (UI-Grundgerüst) läuft. Design-Fundament, Screen 1 und Screen 2 stehen.
Screen 2 ist der Modifier-Browser je Item-Typ: er leitet die Basis-Varianten aus
den Daten ab (`src/lib/baseVariants.ts`, ADR 0006), lässt zwischen ihnen
umschalten und zeigt Präfixe und Suffixe getrennt. Der Feinschliff ist drin: drei
umschaltbare Darstellungen (Karten, Tabelle, Balken über `ViewSwitcher`), farbige
Typ-Tag-Chips je Mod-Familie (`TagChip`, Quelle `implicitTags` gefiltert auf die
Farb-Tags, `src/lib/modTags.ts`) und ein-/ausklappbare Familien samt globalem
„Alle ein-/ausklappen".
Wiederverwendbare Bausteine: `ModifierBrowser`, `ModColumn`, `ModGroupBlock`,
`ModTable`, `TierRow`, `TierBar`, `VariantSelect`, `ViewSwitcher`, `Badge`,
`TagChip`, `ProbabilityBar`; reine Helfer `baseVariants`, `modText`, `modTags`,
`format` mit Tests.

Phase 4 (Facet-Search) ist umgesetzt: eine `FilterBar` mit Volltextsuche über den
Mod-Text, Tag-Pills (ODER-Verknüpfung) und einem Itemstufen-Slider, der `runQuery`
live neu füttert. Die nachgelagerte Filterung ist ein reines Modul
(`src/lib/query/filter.ts`, `filterResult`/`availableTags`, mit Tests). Der
gesamte Filter-, Varianten- und View-Zustand liegt als URL-State auf der Route
`/$type` (Zod-`validateSearch`), Ansichten sind damit teil- und bookmarkbar. Neue
Bausteine: `FilterBar`, `TagFilterPill`, `Slider`, gemeinsames `ui/tagColors`.

Das folgende beschreibt den Stand vor Screen 2:

Design-Fundament und Screen 1 stehen: das
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

Als Nächstes: Phase 5 (optional/später) – PWA-Hülle, Design-Feinschliff,
`docs/Referenz.md`. Die Unique-Ansicht ist zurückgestellt, weil der Export keine
verknüpfbaren Unique-Mod-Daten liefert (ADR 0007). Laufender Betrieb: Daten bei
neuem Patch aktualisieren.

---

## Offene Vorhaben

### Phase 6 – Datenquelle Craft of Exile (echte Gewichte)
Hintergrund: Der repoe-fork-Export (und der PoB-Export) enthalten keine echten
Spawn-Gewichte – PoE2 legt sie nicht offen (alle Werte 1). Craft of Exile
rekonstruiert Gewichte (Trade-Listings + Recombinator, normalisiert) und liefert
sie pro Basis inkl. Tiers, Itemstufe und Rollen-Bereich. Wir bauen die
Datenschicht darauf um. Die Werte sind Schätzungen und werden in der App als
solche gekennzeichnet; Quelle Craft of Exile. Automatischer Abruf ist nicht
möglich (privater Endpunkt, Org-Netzsperre) – die CoE-Dateien werden als
versionierter Snapshot ins Repo gelegt und per Upload aktualisiert.
- [x] Schritt 1: Import + basis-zentriertes Schema aus dem CoE-Snapshot, Zod-validiert, an den Ringen gegengeprüft (echte, variable Gewichte)
- [ ] Schritt 2: Query-Engine auf Basis-Gewichte umstellen (pro Basis Tiers → Wahrscheinlichkeit), Unit-Tests
- [ ] Schritt 3: Screens/Filter/Varianten neu verdrahten (Ausgabe-Formen bleiben, nur Datenquelle wechselt)
- [ ] Schritt 4: Gewichte als CoE-Schätzung kennzeichnen + Attribution, ADR, Doku, Changelog

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

### Phase 3 – UI-Grundgerüst
- [x] Design-Vorlage einarbeiten (Design-System: Tokens, Schriften, Layout-Shell)
- [x] Screen 1: Item-Typ-Auswahl (gruppiertes Kachel-Grid, Suche, Navigation)
- [x] Screen 2: Modifier-Browser (Präfix/Suffix getrennt, Tier, Rollen-Bereich, Gewicht/Wahrscheinlichkeit)
- [x] Basis-Varianten-Selektor (Attribut/Restriktion, datengetrieben) – ADR 0006
- [x] Screen-2-Feinschliff (Tag-Highlight, View-Switcher Cards/Table/Bars, Collapse-all)
- [~] Unique-Ansicht – zurückgestellt: keine verknüpfbaren Unique-Mod-Daten im Export (ADR 0007)

### Phase 4 – Facet-Search
- [x] Tag-Pills (Caster, Fire, Cold, Lightning, …), mehrere als ODER
- [x] Slider für Itemstufe mit Live-Neuberechnung
- [x] Textsuche (Substring/Token) über Mod-Text
- [x] Filter-Zustand als URL-State (teil- und bookmarkbar)

---

## Log

- 2026-07-03, 0.8.0 – Phase 4 (Facet-Search) abgeschlossen. `FilterBar` mit
  Textsuche, Tag-Pills (ODER) und Itemstufen-Slider; nachgelagerte Filterung als
  reines Modul `filter.ts` (`filterResult`/`availableTags`, 7 Tests). Filter-,
  Varianten- und View-Zustand als URL-State auf `/$type` (Zod-`validateSearch`),
  teil- und bookmarkbar. Neue Bausteine `FilterBar`, `TagFilterPill`, `Slider`,
  gemeinsames `ui/tagColors`; itemLevel jetzt live statt fest.
- 2026-07-03, 0.7.0 – Phase 3, Screen-2-Feinschliff. Drei umschaltbare
  Darstellungen (Karten/Tabelle/Balken, `ViewSwitcher`), farbige Typ-Tag-Chips
  je Familie (`TagChip`, Quelle `implicitTags`, `modTags.ts`), ein-/ausklappbare
  Familien plus globaler Schalter. Neue Bausteine `ViewSwitcher`, `TagChip`,
  `ProbabilityBar`, `ModTable`, `TierBar`. 4 neue Tests.
- 2026-07-03, 0.6.0 – Phase 3, Screen 2: Modifier-Browser je Item-Typ. Präfixe
  und Suffixe getrennt, je Mod-Familie die Tiers mit Rollen-Bereich, Itemstufe,
  Gewicht und Chance über `runQuery` (Itemstufe fest 100). Basis-Varianten
  datengetrieben abgeleitet (`baseVariants.ts`, ADR 0006) mit Umschalter bei
  mehreren Basen. Neue Bausteine `ModifierBrowser`, `ModColumn`, `ModGroupBlock`,
  `TierRow`, `VariantSelect`, `Badge`; Helfer `modText`, `format`. 12 neue Tests.
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
