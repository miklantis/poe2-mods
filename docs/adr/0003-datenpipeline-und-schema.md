# ADR 0003 – Datenpipeline und normalisiertes Schema

Status: akzeptiert
Datum: 2026-07-03

## Kontext

Die App braucht schlanke, versionierte Spieldaten. Der poe2-Export von
`repoe-fork/poe2` ist gross (roh > 30 MB) und enthaelt viele Felder und
Domains, die der read-only Modifier-Browser nicht braucht.

## Entscheidung

- Import-Skript (`scripts/import.ts`) zieht den Export, filtert auf
  `domain: item` und Slot Praefix/Suffix, slimt auf die benoetigten Felder und
  legt vier Dateien je Version unter `data/<version>/` ab. Version aus
  `version.txt` (aktuell 4.5.4.3).
- Zod-Schemas in `src/data/schema.ts` sind die Quelle der Wahrheit; TS-Typen
  per `z.infer`. Import und App validieren dagegen.
- Tier und Wahrscheinlichkeit werden nicht gespeichert, sondern in der
  Query-Engine berechnet. Tier = Rangfolge innerhalb einer Gruppe nach
  `required_level`.
- `spawnWeights` bleiben vollstaendig und in Reihenfolge (Semantik „erster
  passender Tag gewinnt"; Gewicht 0 schliesst aus).
- Nur ein Datensatz je Datei-Typ (gemeinsame `mods.json` etc.), keine
  Aufteilung pro Item-Klasse. Groesse nach Slimming ~1,5 MB gesamt – als eine
  Datei problemlos ladbar. Aufteilung bleibt spaetere Option.
- Item-Typen werden auf Klassen mit released Basen beschraenkt, die craftbare
  Mods tragen koennen; Basen wiederum auf diese Klassen. Das laesst
  Nicht-Ausruestung (Mikrotransaktionen, Deko, Relikte) weg.
- Datenablage unter `data/` im Repo-Root (nicht `public/`), damit die
  Betriebs-Ablage klar getrennt bleibt. Ein Vite-Plugin bedient `data/` im Dev
  und kopiert es beim Build nach `dist/data/`.

## Konsequenzen

- Bei neuem Patch: `npm run import` erneut laufen lassen; neue Version landet in
  eigenem Ordner, Manifest wird ergaenzt.
- Der poe2-Export bringt den lesbaren Mod-Text mit; `stat_translations` wird
  nicht benoetigt. Unfertige Platzhalter-Mods (Name „TBD", Text null) werden
  ausgelassen.
- Der Export hat kein `mod_types.json` und kein `stat_translations.json` als
  Einzeldatei – fuer den aktuellen Umfang nicht noetig.
