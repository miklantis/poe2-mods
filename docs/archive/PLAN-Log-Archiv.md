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
- 2026-07-03, 0.9.3 – Itemstufe-Slider sichtbar gemacht. Neue Klasse
  `.il-slider` (index.css) mit sichtbarer Schiene, bis zum Wert gefuelltem
  Bereich (WebKit via `--il-pct`, Firefox via `::-moz-range-progress`) und
  deutlichem Regler; FilterBar zeigt Min/Max unter dem Slider.
- 2026-07-03, 0.9.4 – Phase 7, Schritt 1: Herkunft-Fundament. Import zieht neben
  rollbaren Mods jetzt Corrupted (mgroup 1, affix corrupted) und Desecrated
  (mgroup 10); `mods.json` trägt `origin` und nullable `slot`. Engine
  `runBaseQuery` überspringt slot-lose Mods, neue reine `filterRowsByOrigin`
  trennt die Herkünfte; der Browser filtert strikt auf rollbar (Ansicht
  unverändert, an den Ringen gegengeprüft). ADR 0009 neu. 5 neue Tests (51 gesamt).
- 2026-07-03, 0.10.0 – Phase 7, Schritt 2: Herkunft-Reiter im Browser. Reiter-
  Leiste (nur vorhandene Herkünfte), aktiver Reiter im URL-State (`origin`);
  rollbar mit Chance, Desecrated ohne, Corrupted flach ohne Slot/Chance. Anzeige-
  Bausteine auf Akzent (`components/ui/accent.ts`) + `showProbability` umgestellt;
  neue reine `runFlatQuery` und generisches `filterGroups`; Corrupted-Farbton im
  Theme. 1 neuer Test (52 gesamt).
- 2026-07-03, 0.11.0 – Phase 7: Herkünfte alle gleichzeitig statt Reiter. Rollbar
  oben (Chance), Desecrated grün, Corrupted breite Tabelle rot; durchgehend
  Tabelle (ViewSwitcher/Karten/Balken entfernt), gemeinsamer Filter. Akzent um
  Grün erweitert, Tabellen-`keyNs` gegen Schlüssel-Kollision; tote View-Bausteine
  gelöscht. ADR 0009 mit Nachtrag.
- 2026-07-03 – PLAN aufgeräumt: „Aktueller Stand" auf den Ist-Zustand plus
  Phase-8-Richtung eingedampft, abgeschlossene Phasen 0–7 zu einem Überblick
  verdichtet (Detail in Commits/ADRs), Log-Einträge 0.9.2–0.11.0 ins Archiv
  verschoben.
- 2026-07-03, 0.12.0 – Phase 7, Schritt 3: Essence-Abschnitt (Phase 7 komplett).
  Import zieht mgroup 13 und schreibt `essences.json` je Basis (Stufen je Mod zu
  einem Bereich verdichtet, kleinste Itemstufe); Essence-exklusive Mods mit
  `origin: essence` in `mods.json`. Neue reine `runEssenceQuery` + 5 Tests;
  flache `EssenceColumn`, violetter Akzent, Loader `useEssences`. Snapshot 0.5.4:
  59 Basen mit Essence, 1086 Zeilen. ADR 0009 (Nachtrag).
- 2026-07-03, 0.12.1 – Phase 5 (Design-Feinschliff): Typ-Tags aus den Tabellen
  entfernt (`displayTags` bleibt für die Filterung), Modifier-Text 13→14px.
  Herkunfts-Überschriften raus, Herkunft steht im Tabellennamen; Spaltentitel
  ruhiger. Itemstufen-Regler auf schmalen, linksbündigen Block begrenzt.
- 2026-07-03, 0.12.2 – Phase 5 (Design-Feinschliff): Textgrößen vereinheitlicht,
  alle Modifier-Texte weiß. Theme heller und kontrastärmer (Background, Surface-,
  Border- und shadcn-Basis-Tokens angehoben). Globaler „Alle ein-/ausklappen"-
  Button entfernt; Einzel-Toggle bleibt.
- 2026-07-03, 0.12.3 – Phase 5: Filter-Tags auf poe2db-Granularität erweitert.
  `COLOR_TAG_ORDER` von 10 auf 26 primäre Tags plus die drei Desecrated-Herkünfte
  erweitert; interne Unter-Tags aussen vor (jeder trägt im Snapshot seinen
  Ober-Tag). `tagColors`: nur Schadensarten farbig, Rest neutral.
- 2026-07-03, 0.12.4 – Phase 5: Aufgeklappte Tier-Zeilen zeigen nur noch die
  Wertespanne statt den ganzen Mod-Satz (neuer `tierValueText` in modText.ts,
  +4 Tests). Gruppenkopf trägt weiterhin den vollen Text.
- 2026-07-03, 0.12.5 – Anzeige-Einheit auf den einzelnen Modifier umgestellt
  statt auf die interne Ausschluss-Gruppe. Query-Funktionen gruppieren nach
  Mod-ID; behebt vermischte Tier bei Modifiern, die sich eine Ausschluss-Gruppe
  teilen. Chance je Modifier statt Gruppen-Summe. ADR 0010 neu.
- 2026-07-03 – Phase 8, Schritt 1: Datenfundament repoe. Neues mod-zentriertes
  Schema (`schema.repoe.ts`) und Import (`import-repoe.ts`) aus `repoe-fork/poe2`
  v4.5.4.3; Daten unter `data/4.5.4.3/` (669 Familien inkl. 29 Genesis-Tree,
  1829 Basen, 30 Item-Typen). `manifest.json` bewusst noch auf CoE.
- 2026-07-03 – Phase 8, Schritt 2 (Teil): reine repoe-Query-Engine
  (`repoeEngine.ts`) mit Eignung-über-Tags + Tier-Rangfolge, ohne Gewicht/Chance;
  alle Herkünfte über eine flache Logik. Additiv, App noch unberührt.
- 2026-07-03 – Phase 8, Schritt 2+3 live: App auf repoe umgeschaltet
  (manifest 4.5.4.3). Essence aus CoE je Item-Klasse aufbereitet
  (`import-essences-coe.ts`). ModifierBrowser/Filter/Tabellen auf `RepoeGroup`,
  Chance/Gewicht entfernt. ADR 0011 (löst ADR 0008 ab). Changelog 0.13.0.
- 2026-07-03 – Phase 8, Schritt 4: CoE-Reste entfernt (import-coe, schema.coe,
  baseEngine/essenceEngine + Tests, format.ts, data/0.5.4, roher _source/coe).
  CoE-Essence-Quelle nach `data/_source/coe-essence/` archiviert. Architektur.md
  auf repoe. Phase 8 abgeschlossen.
- 2026-07-03, 0.14.0 – PWA: `vite-plugin-pwa` (autoUpdate) erzeugt Service
  Worker und Web-App-Manifest; Icons aus `favicon.svg` (192/512/maskable,
  apple-touch), Theme-Farbe `#14171d`. App-Hülle vorgeladen, Spieldaten beim
  Benutzen gecacht (Manifest NetworkFirst, `data/<version>/` CacheFirst,
  Changelog StaleWhileRevalidate), SPA-Fallback offline. ADR 0012.
- 2026-07-03 – PLAN verschlankt: Übergang in den Betriebsmodus. Abgeschlossene
  Vorhaben zu einem Überblick verdichtet, Phase-8-Detailblock entfernt (steht in
  ADR 0011 und Commits), Aufbau-Log 0.12.0–Phase 8 ins Archiv verschoben.
- 2026-07-03, 0.15.0 – Weitere Basis-Welten aufgenommen: Jewels, Flasks/Charms,
  Waystones, Tablets, Relics. Import um die Domains misc/flask/area/tablet/
  sanctum_relic erweitert; Domain-Marker isoliert die Welten gegen den
  allgegenwärtigen Tag `default`. 30 → 37 Item-Typen. ADR 0013.
- 2026-07-03, 0.15.1 – Cache-Fix: Spieldaten von CacheFirst auf
  StaleWhileRevalidate (Cache-Name erhoeht), damit In-Place-Updates unter
  gleicher Version beim naechsten Laden greifen (Symptom: fehlende Jewels aus
  dem Offline-Cache). App-Version in der Fusszeile ergaenzt. ADR 0014.
- 2026-07-08, 0.15.2 – Bugfix Tag-Filter: Essence-Einträge tragen jetzt
  Filter-Tags (aus dem CoE-Snapshot), sodass ein aktiver Tag-Filter den
  Essence-Abschnitt nicht mehr komplett ausblendet (Symptom: „+# to Strength“
  verschwand unter „Attribut“). ADR 0015.
- 2026-07-08, 0.15.3 – Itemstufen-Regler aus der Filterleiste in die Kopfzeile
  neben den Item-Namen verlegt (eigene Komponente `ItemLevelControl`, Label und
  Slider mit Abstand); Filterleiste nur noch Suche + Tag-Chips. Mobil unter dem
  Titel.
- 2026-07-08, 0.15.4 – Startseite: getragene Ausrüstung (Rüstungsteile +
  Schmuck) in eine gemeinsame Kategorie „Ausrüstung“ zusammengefasst statt fünf
  getrennter Gruppen; Config in `itemGroups.ts`, Waffen/Offhands unverändert.
- 2026-07-08, 0.15.5 – Modifier-Text: Link-Markup `[Ziel|Anzeige]` wurde auf
  das Link-Ziel statt den Anzeigetext reduziert (Regex nahm die Seite vor dem
  `|`). Folge u. a. vier optisch gleiche „to Resistances“-Suffixe und
  zusammengeschriebene Begriffe. Fix in `modText.ts` (Capture hinter dem `|`),
  Tests angepasst.
