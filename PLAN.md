# PLAN – poe2-mods

## Aktueller Stand

Die App ist im geplanten Umfang fertig und läuft live (GitHub Pages): ein
statischer, read-only Modifier-Browser auf Basis der repoe-Daten
(manifest 4.5.4.3). Startseite mit gruppierter Item-Typ-Auswahl; je Typ ein
Browser, der alle Herkünfte (rollbar, Warp-Runen, Desecrated, Essence,
Corrupted) sowie – bei Ausrüstung – die Augment- und Bonded-Effekte der
Socketables als Tabellen bzw. Listen zeigt, mit gemeinsamem Facet-Filter
(Suche, Tags, Itemstufe) als teil-/bookmarkbarer URL-State. Installierbar und
offline (PWA).

Ab hier Betriebsmodus. Es sind keine Vorhaben mehr eingeplant; laufende Arbeit
sind Bugfixes und die Datenpflege bei neuem Patch (Export ziehen, Import-Skripte
laufen lassen – `import:repoe` und danach `import:augments` –, `data/<version>/`
ablegen, `manifest.json` fortschreiben, committen). Neue Features weiterhin über
Konzept-vor-Code, in kleinen testbaren Schritten. Jede Auslieferung wie gehabt
mit Changelog-Eintrag und Log-Zeile.

## Optionales Backlog

Nicht eingeplant, nur falls gewünscht:
- Design-/Designsystem-Feinschliff
- `docs/Referenz.md` (Kategorie-Liste, Notizen je poe2db-Ansicht)
- sichtbarer Offline-Indikator in der Oberfläche

## Was steht (Überblick)

Detail in den ADRs (`docs/adr/`) und den Commits.

- Setup & Deploy: Vite + React 19 + TypeScript (strict), Tailwind v4,
  shadcn/ui, TanStack Router (file-based) + Query, Base `/poe2-mods/` mit
  SPA-Fallback, GitHub-Actions-Deploy. ADR 0001, 0002.
- Daten: repoe-poe2-Export → mod-zentriertes Schema, Zod-validiert, versioniert
  unter `data/<version>/` mit Manifest; Datenzugriff über Loader-Hooks
  (TanStack Query). Essence aus einem eingefrorenen CoE-Snapshot aufbereitet.
  ADR 0011 (löst ADR 0003, 0004, 0008 ab).
- Query-Engine: reines, DOM-freies Modul (`repoeEngine.ts`): Eignung über Tags
  (Domänen-Marker `__…` und `default` zählen nicht, ADR 0017), freier Slot,
  Itemstufe, Tier-Rangfolge; keine Wahrscheinlichkeit (repoe führt nur Gewicht
  0/1). Unit-Tests via Vitest.
- UI: Design-System (Tokens, Schriften, Shell), Item-Typ-Auswahl,
  Modifier-Browser mit allen Herkünften gleichzeitig als Tabellen, Facet-Search
  als URL-State. ADR 0005, 0006, 0009, 0010. Unique-Ansicht zurückgestellt
  (ADR 0007).
- Augment/Bonded/Warp-Runen: drei zusätzliche Abschnitte je Ausrüstung.
  Warp-Runen (sechs Slot-gebundene Runen) als Herkunft `warp` aus `mods.json`;
  Augment/Bonded invertiert aus `augments.json` (eigene Import-Strecke,
  per-Typ-Datei). ADR 0016.
- PWA: installierbar und offline; App-Hülle vorgeladen, Spieldaten beim Benutzen
  gecacht, stille Hintergrund-Updates. ADR 0012.

## Log

Nur die jüngsten Einträge (Datum, Version, was, ein Satz warum); Detail steht im
Commit. Ältere Einträge im Archiv: `docs/archive/PLAN-Log-Archiv.md`.

- 2026-07-08, 0.16.2 – Bugfix Eignung: `modFitsBase` ignoriert jetzt die
  Domänen-Isolationsmarker (`__dom_*`) und `default`, statt sie als geteilten
  Eignungs-Tag zu werten. Zuvor leakten sieben Rüstungs-/Schmuck-Corrupted
  (Attribute, Einzel-Resistenzen) über `__dom_item` auf Waffen (Claws-Corrupted
  16 → 9, deckt sich mit poe2db); rollbar/Desecrated unverändert. ADR 0017.

- 2026-07-08, 0.16.1 – Warp-Runen korrigiert: sechs Slot-gebundene Runen
  (Waffen Thrud's, Helm Vorana's, Handschuhe Kolr's+Katla's, Körperrüstung
  Medved's, Stiefel Uhtred's, Talisman wie Waffen) statt fälschlich nur Thrud's
  auf jede Ausrüstung. Alle sechs Themen als `warp` klassifiziert (frischer
  repoe-Import, saubere Trennung von Jewel-Mods gleichen Typs); Anzeige je Rune
  ein Präfix/Suffix-Block. ADR 0016.

- 2026-07-08, 0.16.0 – Drei neue Abschnitte je Ausrüstung (poe2db-Vorbild):
  Rune-Magnituden (Herkunft `warp` aus `mods.json`), Augment und Bonded
  (invertiert aus `augments.json` via neuem `import-augments.ts`). Filter wirkt
  mit; Talisman zieht Augment/Bonded aus Waffen- und Rüstungs-Pool. ADR 0016.


- 2026-07-08, 0.15.5 – Modifier-Text: Link-Markup `[Ziel|Anzeige]` wurde auf
  das Link-Ziel statt den Anzeigetext reduziert (Regex nahm die Seite vor dem
  `|`). Folge u. a. vier optisch gleiche „to Resistances“-Suffixe und
  zusammengeschriebene Begriffe. Fix in `modText.ts` (Capture hinter dem `|`),
  Tests angepasst.

- 2026-07-08, 0.15.4 – Startseite: getragene Ausrüstung (Rüstungsteile +
  Schmuck) in eine gemeinsame Kategorie „Ausrüstung“ zusammengefasst statt fünf
  getrennter Gruppen; Config in `itemGroups.ts`, Waffen/Offhands unverändert.

- 2026-07-08, 0.15.3 – Itemstufen-Regler aus der Filterleiste in die Kopfzeile
  neben den Item-Namen verlegt (eigene Komponente `ItemLevelControl`, Label und
  Slider mit Abstand); Filterleiste nur noch Suche + Tag-Chips. Mobil unter dem
  Titel.

- 2026-07-08, 0.15.2 – Bugfix Tag-Filter: Essence-Einträge tragen jetzt
  Filter-Tags (aus dem CoE-Snapshot), sodass ein aktiver Tag-Filter den
  Essence-Abschnitt nicht mehr komplett ausblendet (Symptom: „+# to Strength“
  verschwand unter „Attribut“). ADR 0015.

- 2026-07-03, 0.15.1 – Cache-Fix: Spieldaten von CacheFirst auf
  StaleWhileRevalidate (Cache-Name erhoeht), damit In-Place-Updates unter
  gleicher Version beim naechsten Laden greifen (Symptom: fehlende Jewels aus
  dem Offline-Cache). App-Version in der Fusszeile ergaenzt. ADR 0014.
- 2026-07-03, 0.15.0 – Weitere Basis-Welten aufgenommen: Jewels, Flasks/Charms,
  Waystones, Tablets, Relics. Import um die Domains misc/flask/area/tablet/
  sanctum_relic erweitert; Domain-Marker isoliert die Welten gegen den
  allgegenwärtigen Tag `default`. 30 → 37 Item-Typen. ADR 0013.
