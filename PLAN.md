# PLAN – poe2-mods

## Aktueller Stand

Herkünfte stehen im Browser, alle gleichzeitig (Phase 7 abgeschlossen). Kein
Reiter-Umschalten mehr: oben der rollbare Pool (Präfixe blau, Suffixe gelb, mit
Chance), darunter Desecrated (Präfixe/Suffixe grün, ohne Chance), dann Essence
(Präfixe/Suffixe violett, ohne Chance) und ganz unten Corrupted als breite
Tabelle (rot, ohne Chance). Nur vorhandene Abschnitte erscheinen. Darstellung
ist durchgehend die Tabelle; ein gemeinsamer Filter (Suche, Tags, Itemstufe)
wirkt auf alle Abschnitte.

Essence (Phase 7, Schritt 3) ist umgesetzt: Der Import zieht die Essences
(mgroup 13) und schreibt `essences.json` je Basis; Essence-exklusive Mods stehen
mit `origin: essence` in `mods.json`. Reine Engine `runEssenceQuery` liefert je
Mod genau eine Zeile mit dem Wertebereich über alle Stufen und der kleinsten
erreichbaren Itemstufe (keine Chance – gezielt gesetzt). Neue flache
`EssenceColumn`, violetter Akzent, Loader `useEssences`. Snapshot 0.5.4: 59
Basen mit Essence, 1086 Zeilen; keine Korruption-Essences (alle corrupt=0), daher
keine Markierung nötig. Entscheidung/Nachtrag in ADR 0009.

Damit ist Phase 7 vollständig abgeschlossen.

Design-Feinschliff (0.12.1): Typ-Tags werden in den Tabellen nicht mehr
angezeigt (Filter-Pills oben bleiben), Modifier-Text etwas größer,
Herkunfts-Überschriften entfallen zugunsten sprechender Tabellennamen
(„Desecrated Präfixe" usw.), Itemstufen-Regler kompakt links.

--- Stand Phase 6 (weiter gueltig fuer Datenquelle und Oberflaeche): ---

Phase 6 (Datenquelle Craft of Exile) abgeschlossen. Die App läuft vollständig
auf den CoE-Daten (Version 0.5.4): basis-zentriertes Schema
(`src/data/schema.coe.ts`), reine Engine `runBaseQuery`, beide Screens
verdrahtet. Grund für den Umbau: repoe-fork und der PoB-Export enthalten keine
echten Spawn-Gewichte (alle Werte 1), PoE2 legt sie nicht offen; CoE
rekonstruiert sie (Schätzwerte). Der Schätzwert-Charakter ist in der Oberfläche
kenntlich gemacht (Hinweis im Modifier-Browser, globale Fußzeile mit
Attribution und Datenstand). Doku steht: ADR 0008 dokumentiert die
Datenquelle, ADR 0003/0004/0006 sind als abgelöst markiert, `Architektur.md`
ist auf CoE nachgezogen.

Laufender Betrieb (unverändert): Daten bei neuem Patch aktualisieren (neuen
CoE-Snapshot nach `data/_source/coe/`, `npm run import:coe`, `data/<version>/`
und `manifest.json` fortschreiben).
Hinweis: Die Gewichte im aktuellen Snapshot wirken teils wie Platzhalter (bei
den Ringen durchweg 1000) – das ist Datenqualität des Snapshots, nicht der
Verdrahtung.

--- Stand vor Phase 6 (weiter gueltig fuer die Oberflaeche): ---

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

### Phase 5 – optional/später
- [ ] PWA-Hülle (`vite-plugin-pwa`), Offline-Feinschliff
- [ ] Feinschliff Design/Designsystem
- [ ] `docs/Referenz.md` (Kategorie-Liste, Notizen je poe2db-Ansicht)

---

## Abgeschlossene Vorhaben

### Phase 7 – Herkünfte (rollbar / Corrupted / Desecrated / Essence)
Alle Herkünfte gleichzeitig im Browser (Tabelle). Entscheidungen in ADR 0009.
Socket-Mods ausgeschlossen; Augment/Bonded zurückgestellt (im Snapshot 0.5.4
nicht als eigene Herkunft vorhanden).
- [x] Schritt 1: Datenfundament – Import zieht Corrupted + Desecrated, `origin`
  und nullable `slot` im Schema, Engine überspringt slot-lose Mods,
  `filterRowsByOrigin`, rollbare Ansicht unverändert. Tests, ADR 0009.
- [x] Schritt 2: Herkünfte im Browser sichtbar – zunächst als Reiter, dann auf
  Wunsch zu „alles gleichzeitig" umgebaut (rollbar oben mit Chance, Desecrated
  grün, Corrupted breite Tabelle rot; durchgehend Tabelle, gemeinsamer Filter).
- [x] Schritt 3: Essence als eigener, item-typ-bezogener Datenweg + Abschnitt.
  Import zieht mgroup 13, `essences.json` je Basis, Essence-Mods mit
  `origin: essence`; reine `runEssenceQuery`, flache `EssenceColumn` (je Mod eine
  Zeile, Bereich über alle Stufen), violetter Akzent. ADR 0009 (Nachtrag).

### Phase 6 – Datenquelle Craft of Exile (echte, geschätzte Gewichte)
Umstieg von repoe (keine echten Gewichte, alle Werte 1) auf den
CoE-Snapshot mit rekonstruierten Gewichten pro Basis (Schätzwerte). Details in
ADR 0008.
- [x] Schritt 1: Import + basis-zentriertes Schema aus dem CoE-Snapshot, Zod-validiert, an den Ringen gegengeprüft
- [x] Schritt 2: Query-Engine auf Basis-Gewichte (`runBaseQuery`), Unit-Tests
- [x] Schritt 3: Datenschicht + beide Screens auf CoE-Schema und `runBaseQuery`, Manifest auf 0.5.4, aufgeräumt
- [x] Schritt 4: Schätzung in der Oberfläche gekennzeichnet + Attribution, ADR 0008, Doku, Changelog

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

- 2026-07-03, 0.12.4 – Phase 5: Aufgeklappte Tier-Zeilen zeigen nur noch die
  Wertespanne statt den ganzen Mod-Satz (neuer `tierValueText` in modText.ts,
  mehrere Werte per ` / `, Fallback auf Text ohne Zahlen; +4 Tests). ModTable
  nutzt ihn mit `tabular-nums`. Gruppenkopf trägt weiterhin den vollen Text;
  EssenceColumn unverändert (keine Kopfzeile, keine Doppelung). Typecheck, 61
  Tests, Build grün.
- 2026-07-03, 0.12.3 – Phase 5: Filter-Tags auf poe2db-Granularität erweitert.
  `COLOR_TAG_ORDER` (modTags.ts) von 10 auf 26 primäre Tags plus die drei
  Desecrated-Herkünfte (ulaman/amanamu/kurgal_mod) erweitert; interne Unter-Tags
  bleiben aussen vor, da jeder Unter-Tag im Snapshot auch seinen Ober-Tag trägt
  (Filter fängt sie so ohnehin) – Engine/filter.ts unverändert. `tagColors`:
  nur Schadensarten farbig, Rest neutraler Aktiv-Stil. Tag-Tests angepasst.
  Typecheck, 57 Tests, Build grün.
- 2026-07-03, 0.12.2 – Phase 5 (Design-Feinschliff): Textgrößen vereinheitlicht
  (Familienkopf in ModTable 12.5→14px, weiß statt heading), alle Modifier-Texte
  weiß. Theme insgesamt heller und kontrastärmer: `--background`, Surface-,
  Border- und shadcn-Basis-Tokens angehoben, graue Text-Token (secondary/muted/
  dim) heller. Globaler „Alle ein-/ausklappen"-Button samt Logik
  (toggleAll/allCollapsed/CollapseIcon) entfernt; Einzel-Toggle bleibt.
  Typecheck, 57 Tests, Build grün.
- 2026-07-03, 0.12.1 – Phase 5 (Design-Feinschliff): Typ-Tags aus den Tabellen
  entfernt (Filter-Pills oben unverändert, `displayTags` bleibt für die
  Filterung), Modifier-Text 13→14px. Übergeordnete Herkunfts-Überschriften
  (Rollbar/Desecrated/Essence) raus, Herkunft steht im Tabellennamen (z. B.
  „Desecrated Präfixe"); Spaltentitel ruhiger (kein Display-Font, kleiner).
  Itemstufen-Regler auf schmalen, linksbündigen Block begrenzt. Typecheck, 57
  Tests, Build grün.
- 2026-07-03, 0.12.0 – Phase 7, Schritt 3: Essence-Abschnitt (Phase 7 komplett).
  Import zieht mgroup 13 und schreibt `essences.json` je Basis (Stufen je Mod zu
  einem Bereich verdichtet, kleinste Itemstufe); Essence-exklusive Mods mit
  `origin: essence` in `mods.json`. Neue reine `runEssenceQuery` (je Mod eine
  Zeile, keine Chance) + 5 Tests; flache `EssenceColumn`, violetter Akzent
  (`--color-essence`), Loader `useEssences`, Browser-Abschnitt zwischen Desecrated
  und Corrupted. Snapshot 0.5.4: 59 Basen mit Essence, 1086 Zeilen; keine
  Korruption-Essences. ADR 0009 (Nachtrag). Typecheck, 57 Tests, Build grün.
- 2026-07-03, 0.11.0 – Phase 7: Herkünfte alle gleichzeitig statt Reiter. Rollbar
  oben (Chance), Desecrated grün, Corrupted breite Tabelle rot; durchgehend
  Tabelle (ViewSwitcher/Karten/Balken entfernt), gemeinsamer Filter. Akzent um
  Grün erweitert, Tabellen-`keyNs` gegen Schlüssel-Kollision; tote View-Bausteine
  gelöscht. ADR 0009 mit Nachtrag.
- 2026-07-03, 0.10.0 – Phase 7, Schritt 2: Herkunft-Reiter im Browser. Reiter-
  Leiste (nur vorhandene Herkünfte), aktiver Reiter im URL-State (`origin`);
  rollbar mit Chance, Desecrated ohne, Corrupted flach ohne Slot/Chance. Anzeige-
  Bausteine auf Akzent (`components/ui/accent.ts`) + `showProbability` umgestellt;
  neue reine `runFlatQuery` und generisches `filterGroups`; Corrupted-Farbton im
  Theme. 1 neuer Test (52 gesamt).
- 2026-07-03, 0.9.4 – Phase 7, Schritt 1: Herkunft-Fundament. Import zieht neben
  rollbaren Mods jetzt Corrupted (mgroup 1, affix corrupted) und Desecrated
  (mgroup 10); `mods.json` trägt `origin` und nullable `slot`. Engine
  `runBaseQuery` überspringt slot-lose Mods, neue reine `filterRowsByOrigin`
  trennt die Herkünfte; der Browser filtert strikt auf rollbar (Ansicht
  unverändert, an den Ringen gegengeprüft). ADR 0009 neu. 5 neue Tests (51 gesamt).
- 2026-07-03, 0.9.3 – Itemstufe-Slider sichtbar gemacht. Neue Klasse
  `.il-slider` (index.css) mit sichtbarer Schiene, bis zum Wert gefuelltem
  Bereich (WebKit via `--il-pct`, Firefox via `::-moz-range-progress`) und
  deutlichem Regler; FilterBar zeigt Min/Max unter dem Slider.
- 2026-07-03, 0.9.2 – Modifier-Browser startet vollständig eingeklappt. State
  in `ModifierBrowser` von collapsed- auf expandedKeys umgestellt (Standard =
  eingeklappt, neue Gruppen ebenfalls); collapsedKeys/Toggle-Logik daraus
  abgeleitet, Kind-Schnittstelle unveraendert.
- 2026-07-03, 0.9.1 – Phase 6, Schritt 4: CoE-Herkunft gekennzeichnet. Hinweis
  im Modifier-Browser nahe den Werten, neue globale Fußzeile `AppFooter` mit
  Attribution (Quelle Craft of Exile, Link) und Datenstand (Version/Liga aus
  dem Manifest); Layout-Shell auf Spalten-Layout mit Footer. Doku: ADR 0008 neu
  (Datenquelle CoE), ADR 0003/0004/0006 als abgelöst markiert, `Architektur.md`
  auf CoE nachgezogen. Damit Phase 6 abgeschlossen.
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
- 2026-07-03, 0.8.1 – Phase 6, Schritt 2: Query-Engine auf Basis-Gewichte.
  Neue reine Engine `src/lib/query/baseEngine.ts` (`runBaseQuery`) rechnet je
  Basis plus Itemstufe die Präfix-/Suffix-Gruppen mit Tier und Chance; jeder
  erreichbare Tier ist ein eigener gewichteter, konkurrierender Eintrag.
  Ausgabe-Formen `ModGroup`/`ComputedMod` beibehalten (nun mit `ilvl`/`values`
  je Tier). Neues CoE-Zod-Schema `src/data/schema.coe.ts` als Typ-Grundlage.
  13 Unit-Tests. Alte `engine.ts`/`schema.ts` und App-Verdrahtung unberührt –
  Umstellung folgt in Schritt 3.
- 2026-07-03, 0.8.0 – Phase 4 (Facet-Search) abgeschlossen. `FilterBar` mit
  Textsuche, Tag-Pills (ODER) und Itemstufen-Slider; nachgelagerte Filterung als
  reines Modul `filter.ts` (`filterResult`/`availableTags`, 7 Tests). Filter-,
  Varianten- und View-Zustand als URL-State auf `/$type` (Zod-`validateSearch`),
  teil- und bookmarkbar. Neue Bausteine `FilterBar`, `TagFilterPill`, `Slider`,
  gemeinsames `ui/tagColors`; itemLevel jetzt live statt fest.

Ältere Einträge (0.1.0–0.7.0) im Archiv: `docs/archive/PLAN-Log-Archiv.md`.
