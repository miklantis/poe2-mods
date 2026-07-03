# Architektur – poe2-mods

Kurzüberblick über Aufbau und Leitplanken. Details zu einzelnen Entscheidungen
liegen in `docs/adr/`.

## Zweck

Statischer, durchsuchbarer Modifier-Browser für Path of Exile 2 (read-only).
Er liest versionierte JSON-Daten aus Community-Exports der Spieldaten und zeigt
je Item-Typ die möglichen Modifier mit Tier, Rollen-Bereich und Spawn-Gewicht.

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

Quelle der Wahrheit fuer die Datenformen sind die Zod-Schemas in
`src/data/schema.ts`; die TypeScript-Typen werden per `z.infer` daraus
abgeleitet. Das Import-Skript und die App validieren gegen dieselben Schemas.

Vier normalisierte Dateien je Version:

- `item_types.json` – Item-Klassen mit released Basen, auf die craftbare Mods
  rollen koennen (id, Name, Kategorie). Grundlage fuer Kategorien und Routen.
- `base_items.json` – released Basen der behaltenen Klassen (id, Name,
  Item-Klasse, Tags, Droplevel, Implicits, Anforderungen).
- `mods.json` – Item-Domain-Mods vom Typ Praefix/Suffix mit mindestens einem
  Spawn-Gewicht > 0 (id, Name, Typ, Gruppen, Slot, required_level, Stat-Ranges,
  Text, Spawn-Gewichte je Tag, Zusatz-Flags). Der lesbare Text kommt direkt aus
  dem Export.
- Dazu `data/manifest.json` – aktive Version, verfuegbare Versionen, Quelle,
  Zeitstempel.

Bewusst nicht in den Daten: Tier und Wahrscheinlichkeit. Beide werden in der
Query-Engine (Phase 2) berechnet – Tier aus der Rangfolge innerhalb einer
Gruppe nach `required_level`, Wahrscheinlichkeit aus den Gewichten relativ zum
verfuegbaren Pool. Die `spawnWeights` bleiben vollstaendig und in Reihenfolge,
weil die Spawn-Semantik „erster passender Tag gewinnt" lautet und Eintraege mit
Gewicht 0 gezielt ausschliessen. Ebenfalls draussen: Uniques, Essenzen/Runen und
alle Nicht-Item-Domains.

## Datenpipeline

Das Import-Skript `scripts/import.ts` (Aufruf `npm run import`) zieht den
poe2-Export von `repoe-fork/poe2`, filtert und slimt ihn auf das Schema,
validiert mit Zod und legt das Ergebnis unter `data/<version>/` ab; das
Manifest wird fortgeschrieben. Die Version kommt aus `version.txt` des Exports.

Datenzugriff in der App laeuft ueber Hooks (`useManifest`, `useMods`,
`useBaseItems`, `useItemTypes`, `useTags`) via TanStack Query; sie validieren
beim Laden erneut gegen die Schemas.

## Deployment

GitHub Pages über GitHub Actions. Vite `base` ist `/poe2-mods/`. Für Deep-Links
wird beim Build `index.html` nach `404.html` kopiert (SPA-Fallback). Die
versionierten Daten liegen unter `data/` im Repo-Root; ein Vite-Plugin bedient
`data/` im Dev-Server und kopiert es beim Build nach `dist/data/`.

## Ist-Zustand

Phase 0 (Setup), Phase 1 (Datenpipeline und Schema) und Phase 2 (Query-Engine)
umgesetzt: Grundgerüst, Routing, Styling, Deploy-Pipeline; Zod-Schema,
Import-Skript, normalisierte Daten (Version 4.5.4.3), Loader-Hooks mit
Validierung beim Laden und eine Datenstatus-Anzeige auf der Startseite. Die
Query-Engine (`src/lib/query/engine.ts`) errechnet als reines Modul aus
Item-Tags plus Itemstufe die spawn-baren Mods mit Tier und Wahrscheinlichkeit
(mit Unit-Tests). Noch offen: fachliche Ansichten je Item-Typ (UI-Grundgerüst)
und Facet-Search.
