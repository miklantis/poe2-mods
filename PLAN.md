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
  per-Typ-Datei), je Familie aufklappbar mit ihren Quellen (Stufe/Typ, Wert,
  Level). ADR 0016, 0018, 0019.
- PWA: installierbar und offline; App-Hülle vorgeladen, Spieldaten beim Benutzen
  gecacht, stille Hintergrund-Updates. ADR 0012.

## Log

Nur die jüngsten Einträge (Datum, Version, was, ein Satz warum); Detail steht im
Commit. Ältere Einträge im Archiv: `docs/archive/PLAN-Log-Archiv.md`.

- 2026-07-09, Doku – Klärung Corrupted bei Relics: repoe führt (auch in
  `mods_by_base.json`) nur einen corrupted Relic-Mod (`SanctumResolveRecovery`).
  Die sieben Orb-of-Sacrifice-Implicits von poe2db stehen nicht in den
  Spieldaten und werden bewusst nicht manuell ergänzt (datentreu). ADR 0021.

- 2026-07-09, 0.17.5 – Fenstertitel-Dopplung behoben: Als Chrome-PWA stellt
  die App den Manifest-Namen („poe2-mods – Modifier-Browser") dem
  `document.title` voran. Dieser trägt jetzt nur noch die Version (`v0.17.5`)
  statt den ganzen Namen zu wiederholen. Nur `__root.tsx`.

- 2026-07-09, 0.17.4 – Relic-Corrupted-Mod sichtbar + App-Version im
  Fenstertitel. Import: in den isolierten Nicht-Item-Welten (sanctum_relic,
  tablet, area) bekommt eine domänenweite Familie (nur `default`) statt nur des
  Domänen-Markers die realen Welt-Tags, weil der Marker in der Engine nicht als
  Eignung zählt (ADR 0017). Folge: `SanctumResolveRecovery` matcht wieder alle
  Relic-Größen (der einzige corrupted Relic-Mod im repoe-Export; weitere
  Corruption-Implicits sind dort nicht enthalten). Root setzt `document.title`
  mit `changelog.current`. `mods.json` neu erzeugt, Engine-Test ergänzt.

- 2026-07-09, 0.17.3 – Startseiten-Kategorie korrigiert: Talismane zu den
  Zweihandwaffen statt zur Ausrüstung. Der repoe-Typ `Talisman` ist eine
  Zweihandwaffe (Basen unter `TwoHandWeapons/Talismans`, Tags `two_hand_weapon`,
  `twohand`, `weapon`), kein Schmuck. Reine Config in `itemGroups.ts`, Test
  ergänzt. Kein ADR.

- 2026-07-09, 0.17.2 – Nachtrag: `current` in `changelog.json` stand noch auf
  0.17.1, obwohl der 0.17.2-Eintrag schon vorhanden war; korrigiert, damit
  Footer und Changelog-Aktualität stimmen. Reine JSON-Änderung.

- 2026-07-09, 0.17.2 – Startseiten-Kategorien korrigiert: Traps zu den
  Zweihandwaffen (Basen tragen den Tag `twohand`) statt in eine eigene
  Werkzeug-Kategorie; Relics, Tablets und Waystones zu einer Kategorie
  „Endgame" gebündelt. Reine Config in `itemGroups.ts` (plus Icon `bomb` in
  `icons.ts`), Tests ergänzt. Kein ADR.

- 2026-07-08, 0.17.1 – Augment/Bonded-Quellen tragen den echten Sockelbaren-Namen
  (aus `base_items.json`, per Metadaten-Schlüssel) statt nur Stufe+Typ – z. B.
  „Perfect Desert Rune", „Idol of the Martyr", „Amanamu's Gaze". Fallback auf die
  abgeleitete Bezeichnung bleibt. ADR 0020.

- 2026-07-08, 0.17.0 – Augment/Bonded aufklappbar: je Familie werden die Quellen
  gezeigt (Sockelbaren-Stufe + Typ, konkreter Wert, benötigtes Level), aus
  Stufe-Einträgen/`type_name`/`required_level` der repoe-`augments.json`
  abgeleitet. Schema um `sources` erweitert, `AugmentColumn` wie `ModTable`
  aufklappbar, `augments.json` neu erzeugt. ADR 0019.

- 2026-07-08, 0.16.3 – Bugfix Augment/Bonded: der Import hält alle Stat-Zeilen
  einer (Sockelbares, Kategorie) als einen Modifier zusammen (`\n`-getrennt),
  statt zweizeilige Mods in Einzeleffekte zu zerlegen. Gekoppelte
  Nachteil/Vorteil-Mods erscheinen wieder als ein Eintrag; Zählung deckt sich mit
  poe2db (Wand Augment 46/Bonded 38, Claw/Dagger 61/37). `augments.json` für alle
  30 Typen neu erzeugt. ADR 0018.

- 2026-07-08, 0.16.2 – Bugfix Eignung: `modFitsBase` ignoriert jetzt die
  Domänen-Isolationsmarker (`__dom_*`) und `default`, statt sie als geteilten
  Eignungs-Tag zu werten. Zuvor leakten sieben Rüstungs-/Schmuck-Corrupted
  (Attribute, Einzel-Resistenzen) über `__dom_item` auf Waffen (Claws-Corrupted
  16 → 9, deckt sich mit poe2db); rollbar/Desecrated unverändert. ADR 0017.
