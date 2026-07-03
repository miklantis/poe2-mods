# 0007 – Unique-Ansicht vorerst zurueckgestellt

## Status
Angenommen (2026-07-03)

## Kontext
Phase 3 sah eine Unique-Ansicht vor, mit dem ausdruecklichen Vorbehalt
„Datenlage klaeren". Die Pruefung des repoe-fork/poe2-Exports (unsere Quelle der
Wahrheit) ergab:

- `data/uniques.json` listet 449 Uniques, aber nur als Registry: `name`,
  `item_class`, Inventargroesse und ein Bildverweis. Keine Modifier, keine
  Rollen-Bereiche, kein Flavour-Text.
- Der Roh-Mod-Export enthaelt zwar ueber 10.000 Mods mit
  `generation_type: unique`, aber keinerlei Verknuepfung zum konkreten
  Unique-Item: die Mod-Schluessel sind beschreibende Slugs
  (`UniqueGlobalColdSpellGemsLevel1`), das Namensfeld ist leer, und die
  Namensueberschneidung mit den Unique-Items ist null.
- Die Zuordnung Unique-Item -> feste Mods liegt in den .dat-Spieldateien, die
  der Export nicht in verknuepfbarer Form mitliefert.

## Entscheidung
Die Unique-Ansicht wird zurueckgestellt. Eine sinnvolle Ansicht (Unique plus
seine festen Mods mit Werten, wie auf poe2db) ist aus der aktuellen Quelle der
Wahrheit nicht baubar, ohne die Projektregel „kein poe2db-Scraping" zu brechen.
Eine reine Namensliste ohne Mods hat wenig Nutzen und liegt ausserhalb des
Kern-Scopes (rollbarer Modifier-Browser).

Naechster Block ist stattdessen Phase 4 (Facet-Search), die auf den vorhandenen
Tag-Chips aufbaut.

## Konsequenzen
- Kein Unique-Feature bis eine verknuepfbare Datenquelle vorliegt (z. B. ein
  spaeterer repoe-fork-Export mit Unique-Mod-Zuordnung oder eine bewusst
  beschlossene Zusatzquelle). Dann neu bewerten.
- Der Import bleibt auf mods, base_items, item_types und tags beschraenkt.
