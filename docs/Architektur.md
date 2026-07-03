# Architektur – poe2-mods

Kurzüberblick über Aufbau und Leitplanken. Details zu einzelnen Entscheidungen
liegen in `docs/adr/`.

## Zweck

Statischer, durchsuchbarer Modifier-Browser für Path of Exile 2 (read-only).
Er liest versionierte JSON-Daten und zeigt je Item-Typ und Basis-Variante die
möglichen Modifier mit Tier, Rollen-Bereich und Spawn-Gewicht. Die Gewichte
(und damit Tier und Chance) sind Schätzwerte aus Craft of Exile – PoE2 legt die
echten Gewichte nicht offen (siehe ADR 0008).

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
`src/data/schema.coe.ts`; die TypeScript-Typen werden per `z.infer` daraus
abgeleitet. Import-Skript und App validieren gegen dieselben Schemas.

Das Schema ist basis-zentriert: die Spawn-Gewichte hängen an der Basis, nicht am
Mod. Vier normalisierte Dateien je Version:

- `item_types.json` – Item-Typen mit ihren Basis-Varianten (id, Name, Kategorie,
  `variants` je mit Basis-Id und Label). Grundlage für Kategorien und Routen.
- `mods.json` – schlanke Mod-Metadaten (id, Text als Vorlage mit `#`, Slot
  Präfix/Suffix oder `null`, Herkunft `origin`, Gruppe, Tags). `origin` ist
  `rollable | corrupted | desecrated | essence`; `slot` ist `null` bei Mods ohne
  Präfix/Suffix-Belegung (Corrupted). Der lesbare Text stammt aus dem Export.
- `base_mods.json` – je Basis-Id die rollbaren, Corrupted- und Desecrated-Mods
  mit ihren Tiers: Itemstufe (`ilvl`), Gewicht und Rollen-Bereiche (`values` als
  `[min, max]`-Paare). Die Herkunft-Trennung passiert über `origin` am Mod.
- `essences.json` – je Basis-Id die per Essence garantierten Mods, je Mod eine
  Zeile `{ mod, ilvl, values }`: der Wertebereich über alle Essence-Stufen und
  die kleinste dafür nötige Itemstufe. Eigener Datenweg, ohne Gewicht/Chance.
- Dazu `data/manifest.json` – aktive Version, verfügbare Versionen, Quelle,
  Liga, Zeitstempel.

Bewusst nicht in den Daten: Tier und Wahrscheinlichkeit. Beide werden in der
Query-Engine berechnet (siehe unten). Ebenfalls draußen: Uniques und
Nicht-Item-Domains.

## Query-Engine

`src/lib/query/baseEngine.ts` (`runBaseQuery`) ist ein reines, DOM-freies,
getestetes Modul. Es nimmt die Mod-Zeilen einer Basis (`base_mods[basis]`), eine
Nachschlage-Map der Mods und eine Itemstufe und liefert Präfixe und Suffixe je
Gruppe mit Tier und Chance. Regel: jeder bei der Itemstufe erreichbare Tier
(`ilvl ≤ Itemstufe`) ist ein eigener gewichteter, konkurrierender Eintrag;
Chance je Tier = Tier-Gewicht / Slot-Pool; höchstes `ilvl` = Tier 1. Die
nachgelagerte Facet-Filterung (Suche, Tags) liegt getrennt in
`src/lib/query/filter.ts`.

Für die slot-losen und gezielt gesetzten Herkünfte gibt es zwei weitere reine
Module: `runFlatQuery` (im selben `baseEngine.ts`) für Corrupted – flach, ohne
Präfix/Suffix und ohne Chance – und `src/lib/query/essenceEngine.ts`
(`runEssenceQuery`) für Essence: je Mod genau eine `DisplayGroup`, nach Slot
getrennt, mit dem Bereich über alle Stufen und der kleinsten Itemstufe, ebenfalls
ohne Chance. Alle drei liefern den gemeinsamen `DisplayGroup`, sodass Filter und
Tag-Sammlung einheitlich greifen.

## Datenpipeline

Quelle der Wahrheit für die Gewichte ist ein versionierter Craft-of-Exile-
Snapshot unter `data/_source/coe/` (Schätzwerte; siehe ADR 0008). Das
Import-Skript `scripts/import-coe.ts` (Aufruf `npm run import:coe`) normalisiert
ihn auf das Schema, validiert mit Zod und legt das Ergebnis unter
`data/<version>/` ab; das Manifest wird fortgeschrieben.

Datenzugriff in der App läuft über Hooks (`useManifest`, `useMods`,
`useItemTypes`, `useBaseMods`, `useEssences`) via TanStack Query; sie validieren beim Laden
erneut gegen die Schemas.

## Deployment

GitHub Pages über GitHub Actions. Vite `base` ist `/poe2-mods/`. Für Deep-Links
wird beim Build `index.html` nach `404.html` kopiert (SPA-Fallback). Die
versionierten Daten liegen unter `data/` im Repo-Root; ein Vite-Plugin bedient
`data/` im Dev-Server und kopiert es beim Build nach `dist/data/` – ohne
`data/_source` (die Roh-Snapshots gehören nicht ins Deploy).

## Ist-Zustand

Phasen 0 bis 4 umgesetzt: Grundgerüst, Routing, Styling, Deploy-Pipeline;
Datenpipeline und Schema; reine Query-Engine; UI-Grundgerüst (Item-Typ-Auswahl
und Modifier-Browser je Item-Typ mit Basis-Varianten, drei Darstellungen und
Tag-Highlight); Facet-Search (Suche, Tag-Pills, Itemstufen-Slider) mit
Filterzustand im URL-State.

Phase 6 (Datenquelle Craft of Exile) fast fertig: die App läuft vollständig auf
dem basis-zentrierten CoE-Schema (Version 0.5.4). Der Schätzwert-Charakter der
Gewichte ist in der Oberfläche kenntlich gemacht (Hinweis im Browser, globale
Fußzeile mit Attribution). Offen bleibt der laufende Betrieb: Daten bei neuem
Patch aktualisieren. Die Unique-Ansicht ist zurückgestellt (ADR 0007).
