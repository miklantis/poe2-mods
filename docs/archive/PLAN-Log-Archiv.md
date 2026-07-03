# PLAN-Log – Archiv

Ausgelagerte, älteste Log-Einträge aus `PLAN.md`. Chronologisch, älteste zuerst.

- 2026-07-03, 0.1.0 – Phase 0 (Setup) abgeschlossen. Grundgerüst, Routing,
  Styling, Deploy-Pipeline und Docs-Struktur stehen; Basis für die Datenpipeline gelegt.
- 2026-07-03, 0.2.0 – Phase 1 (Datenpipeline und Schema) abgeschlossen. Zod-Schema,
  Import-Skript, normalisierte Daten (4.5.4.3), Loader-Hooks mit Validierung und
  Datenstatus-Anzeige. An den Ringen gegen poe2db gegengeprüft.
- 2026-07-03, 0.3.0 – Phase 2 (Query-Engine) abgeschlossen. Reines Modul
  `src/lib/query/engine.ts`: Eignung nach „erster passender Tag gewinnt", Tier je
  Gruppe plus Slot, Itemstufen-Filter, Wahrscheinlichkeit pro Slot. 11 Unit-Tests.
- 2026-07-03, 0.4.0 – Phase 3 gestartet: Design-System eingezogen. Dunkles Theme
  aus dem Handoff als Tokens (Farben, Text-Abstufungen, Präfix-/Suffix- und
  Tag-Farben), drei self-hosted Schriften (Space Grotesk, Manrope, JetBrains
  Mono), Hintergrund-Glow, schlanke Layout-Shell ohne globalen Header. Grundlage
  für die Item-Ansichten.
- 2026-07-03, 0.5.0 – Phase 3, Screen 1: Item-Typ-Auswahl. Gruppiertes
  Kachel-Grid aus den Daten (Config in `itemGroups.ts` liefert Reihenfolge,
  Labels und Icons; Unbekanntes fällt nach „Other"), Substring-Suche,
  Navigation auf die Browser-Route `/$type` (noch Platzhalter). Reine
  Gruppierungslogik mit 6 Tests. Input-Primitive und `ItemTypeTile` als
  wiederverwendbare Bausteine.
- 2026-07-03, 0.6.0 – Phase 3, Screen 2: Modifier-Browser je Item-Typ. Präfixe
  und Suffixe getrennt, je Mod-Familie die Tiers mit Rollen-Bereich, Itemstufe,
  Gewicht und Chance über runQuery (Itemstufe fest 100). Basis-Varianten
  datengetrieben abgeleitet (baseVariants.ts, ADR 0006) mit Umschalter bei
  mehreren Basen. Neue Bausteine ModifierBrowser, ModColumn, ModGroupBlock,
  TierRow, VariantSelect, Badge; Helfer modText, format. 12 neue Tests.
- 2026-07-03, 0.7.0 – Phase 3, Screen-2-Feinschliff. Drei umschaltbare
  Darstellungen (Karten/Tabelle/Balken, ViewSwitcher), farbige Typ-Tag-Chips je
  Familie (TagChip, Quelle implicitTags, modTags.ts), ein-/ausklappbare Familien
  plus globaler Schalter. Neue Bausteine ViewSwitcher, TagChip, ProbabilityBar,
  ModTable, TierBar. 4 neue Tests.
- 2026-07-03, 0.8.0 – Phase 4 (Facet-Search) abgeschlossen. `FilterBar` mit
  Textsuche, Tag-Pills (ODER) und Itemstufen-Slider; nachgelagerte Filterung als
  reines Modul `filter.ts` (`filterResult`/`availableTags`, 7 Tests). Filter-,
  Varianten- und View-Zustand als URL-State auf `/$type` (Zod-`validateSearch`),
  teil- und bookmarkbar. Neue Bausteine `FilterBar`, `TagFilterPill`, `Slider`,
  gemeinsames `ui/tagColors`; itemLevel jetzt live statt fest.
- 2026-07-03, 0.8.1 – Phase 6, Schritt 2: Query-Engine auf Basis-Gewichte.
  Neue reine Engine `src/lib/query/baseEngine.ts` (`runBaseQuery`) rechnet je
  Basis plus Itemstufe die Präfix-/Suffix-Gruppen mit Tier und Chance; jeder
  erreichbare Tier ist ein eigener gewichteter, konkurrierender Eintrag.
  Ausgabe-Formen `ModGroup`/`ComputedMod` beibehalten (nun mit `ilvl`/`values`
  je Tier). Neues CoE-Zod-Schema `src/data/schema.coe.ts` als Typ-Grundlage.
  13 Unit-Tests. Alte `engine.ts`/`schema.ts` und App-Verdrahtung unberührt –
  Umstellung folgt in Schritt 3.
- 2026-07-03, 0.9.0 – Phase 6, Schritt 3: App auf die CoE-Datenquelle
  umgestellt. Manifest auf `0.5.4`; Loader/Hooks auf `schema.coe.ts` (neuer
  `useBaseMods`, `useBaseItems`/`useTags` entfallen). Screen 2 verdrahtet auf
  `runBaseQuery`: Varianten direkt aus `item_types.json`, Rechnung je Basis
  ueber `base_mods`, Rollen-Bereiche pro Tier via `fillModText`/`formatRoll`.
  Screen 1 gruppiert datengetrieben nach `category`. Aufgeraeumt: alte
  `engine.ts`/`schema.ts`/`baseVariants.ts`, repoe-Importer und dessen
  npm-Script entfernt, `data/4.5.4.3` geloescht, `data/_source` aus dem Deploy
  ausgeschlossen. VariantSelect/Filter/modTags/modText/itemGroups mitgezogen.
  Typecheck, 48 Tests, Build gruen; an den Ringen realdaten-gegengeprueft.
- 2026-07-03, 0.9.1 – Phase 6, Schritt 4: CoE-Herkunft gekennzeichnet. Hinweis
  im Modifier-Browser nahe den Werten, neue globale Fußzeile `AppFooter` mit
  Attribution (Quelle Craft of Exile, Link) und Datenstand (Version/Liga aus
  dem Manifest); Layout-Shell auf Spalten-Layout mit Footer. Doku: ADR 0008 neu
  (Datenquelle CoE), ADR 0003/0004/0006 als abgelöst markiert, `Architektur.md`
  auf CoE nachgezogen. Damit Phase 6 abgeschlossen.
- 2026-07-03, 0.9.2 – Modifier-Browser startet vollständig eingeklappt. State
  in `ModifierBrowser` von collapsed- auf expandedKeys umgestellt (Standard =
  eingeklappt, neue Gruppen ebenfalls); collapsedKeys/Toggle-Logik daraus
  abgeleitet, Kind-Schnittstelle unveraendert.
