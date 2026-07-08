# Architektur – poe2-mods

Kurzüberblick über Aufbau und Leitplanken. Details zu einzelnen Entscheidungen
liegen in `docs/adr/`.

## Zweck

Statischer, durchsuchbarer Modifier-Browser für Path of Exile 2 (read-only).
Er liest versionierte JSON-Daten und zeigt je Item-Typ und Basis-Variante die
möglichen Modifier mit Tier und Rollen-Bereich. Datenquelle sind die Spieldaten
aus dem repoe-Export; dieser führt nur binäre Spawn-Gewichte (0/1), daher gibt
es keine Wahrscheinlichkeit – alle Herkünfte werden einheitlich mit Tier und
Wertebereich gezeigt (siehe ADR 0011). Der Essence-Abschnitt ist einmalig aus
Craft-of-Exile-Daten aufbereitet.

## Tech-Stack

- React 19 mit Vite als Build-Werkzeug
- TypeScript strict (kein `any`)
- TanStack Router (file-based, `src/routes`)
- TanStack Query für den Datenzugriff (der „Server" sind die statischen JSONs)
- Tailwind CSS v4, shadcn/ui-Primitives in `src/components/ui`
- Lucide-Icons
- Zod als Quelle der Wahrheit für Datenformen; TS-Typen daraus abgeleitet
- Vitest für Unit-Tests

## Leitplanken

- Query-/Filter-Logik bleibt ein DOM-freies, testbares Modul.
- Datenzugriff ist in Hooks gekapselt; Komponenten kennen die JSON-Struktur nicht direkt.
- Wiederverwendbare Primitives in `src/components/ui`.
- Bedienbegriffe deutsch, Code-/Architekturbegriffe englisch, Mod-Texte im Original-Spieltext.

## Datenschema

Quelle der Wahrheit für die Datenformen sind die Zod-Schemas in
`src/data/schema.repoe.ts`; die TypeScript-Typen werden per `z.infer` daraus
abgeleitet. Import-Skript und App validieren gegen dieselben Schemas.

Das Schema ist mod-zentriert: die Tiers hängen am Modifier, die Eignung läuft
über Tags (Basis-Tags gegen Mod-Tags). Kein Gewichtsfeld. Normalisierte Dateien
je Version:

- `item_types.json` – Item-Typen mit ihren Basis-Varianten (id, Name, Kategorie,
  `variants` je mit Basis-Id und Label). Grundlage für Kategorien und Routen.
  Gleichnamige Basen ergeben eine Variante.
- `mods.json` – Modifier-Familien: id, Text (Vorlage; repoe schreibt die
  Rollen-Bereiche inline als `(min-max)`), Slot (Präfix/Suffix oder `null` bei
  Corrupted/Essence), Herkunft `origin` (`rollable | corrupted | desecrated`),
  Eignungs-Tags und die Tiers (`id`, `ilvl`, Name, Text, `values` als
  `[min, max]`-Paare).
- `base_items.json` – Basen mit id, Name, Item-Klasse (`itemClass`) und Tags.
  Die Tags entscheiden über die Eignung.
- `tags.json` – Tag-Metadaten (Anzeigename, Crafting-Relevanz).
- `essences.json` – je Item-Klasse die per Essence garantierten Mods, je Eintrag
  `{ id, text, slot, ilvl, values, filterTags }`: der Wertebereich über alle
  Essence-Stufen, die kleinste dafür nötige Itemstufe und die beschreibenden
  Filter-Tags (für die Pills; aus CoE, siehe ADR 0015). Aus CoE aufbereitet,
  selbst-enthaltend.
- Dazu `data/manifest.json` – aktive Version, verfügbare Versionen, Quelle,
  Liga, Zeitstempel.

Bewusst nicht in den Daten: die Tier-Rangfolge (wird in der Engine aus der
Itemstufe berechnet). Ebenfalls draußen: Uniques.

Der Browser deckt mehrere Basis-Welten ab: Ausrüstung (`domain item`), Jewels
(`misc`), Flasks/Charms (`flask`), Waystones (`area`), Tablets (`tablet`) und
Relics (`sanctum_relic`). Jede Welt ist gegen die anderen isoliert: der
allgegenwärtige Tag `default` zählt weder als craftbarer noch als Eignungs-Tag.
Domänenweite Mods (nur `default`) bekommen stattdessen einen unsichtbaren Marker
(`__dom_<domain>`), der auch an die Basen ihrer Welt gehängt wird. So erscheinen
Flask-, Jewel-, Waystone-, Tablet- und Relic-Mods nur auf ihren eigenen Basen.
Siehe ADR 0013.

## Query-Engine

`src/lib/query/repoeEngine.ts` ist ein reines, DOM-freies, getestetes Modul.
`runRepoeQuery` nimmt alle Mods, die Tags der Basis, eine Herkunft und eine
Itemstufe und liefert die passenden Familien (Herkunft + Eignung über Tags) mit
ihren bei der Itemstufe erreichbaren Tiers. Regel: höchstes `ilvl` = Tier 1 (Rang
stabil über die volle Tier-Liste); nur Tiers mit `ilvl ≤ Itemstufe` erscheinen.
Kein Gewicht, keine Chance – alle Herkünfte laufen über dieselbe flache Logik;
Präfix/Suffix ergibt sich aus `group.slot`, Corrupted hat `slot` null.

Der Essence-Abschnitt kommt über `essenceGroups` (im selben Modul): es baut aus
den Essence-Einträgen einer Item-Klasse Anzeige-Zeilen mit je einem Tier. Die
nachgelagerte Facet-Filterung (Suche, Tags) liegt getrennt in
`src/lib/query/filter.ts` und arbeitet auf dem gemeinsamen `RepoeGroup`.

## Datenpipeline

Quelle der Wahrheit sind die Spieldaten aus dem repoe-Export
(`repoe-fork/poe2`). Das Import-Skript `scripts/import-repoe.ts` (Aufruf
`npm run import:repoe`) zieht die Rohdaten, gruppiert die Mod-Einträge zu
Familien, validiert mit Zod und legt das Ergebnis unter `data/<version>/` ab.

Der Essence-Abschnitt wird einmalig aus einem eingefrorenen CoE-Snapshot unter
`data/_source/coe-essence/` aufbereitet (`scripts/import-essences-coe.ts`, Aufruf
`npm run import:essences`); Ergebnis `essences.json` je Item-Klasse. Siehe
ADR 0011.

Datenzugriff in der App läuft über Hooks (`useManifest`, `useMods`,
`useItemTypes`, `useBaseItems`, `useEssences`) via TanStack Query; sie validieren
beim Laden erneut gegen die Schemas.

## Deployment

GitHub Pages über GitHub Actions. Vite `base` ist `/poe2-mods/`. Für Deep-Links
wird beim Build `index.html` nach `404.html` kopiert (SPA-Fallback). Die
versionierten Daten liegen unter `data/` im Repo-Root; ein Vite-Plugin bedient
`data/` im Dev-Server und kopiert es beim Build nach `dist/data/` – ohne
`data/_source` (die eingefrorene Essence-Quelle gehört nicht ins Deploy).

## Ist-Zustand

Phasen 0 bis 4 umgesetzt: Grundgerüst, Routing, Styling, Deploy-Pipeline;
Datenpipeline und Schema; reine Query-Engine; UI (Item-Typ-Auswahl und
Modifier-Browser je Item-Typ mit Basis-Varianten); Facet-Search (Suche,
Tag-Pills, Itemstufen-Slider) mit Filterzustand im URL-State.

Phase 8 (Datenquelle zurück auf repoe) umgesetzt: die App läuft auf dem
mod-zentrierten repoe-Schema (Version 4.5.4.3), alle Herkünfte einheitlich mit
Tier und Wertebereich, ohne Chance. Die Pools sind vollständig (inkl.
Genesis-Tree). Essence bleibt aus CoE-Daten erhalten. Die Unique-Ansicht ist
zurückgestellt (ADR 0007). Offen bleibt der laufende Betrieb: Daten bei neuem
Patch aktualisieren.
