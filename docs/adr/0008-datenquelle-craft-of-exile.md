# ADR 0008 – Datenquelle Craft of Exile (echte, geschätzte Gewichte)

Status: akzeptiert (2026-07-03)
Datum: 2026-07-03

Löst ab: ADR 0003 (repoe-Pipeline/Schema), ADR 0004 (Query-Engine-Regeln über
Tags), ADR 0006 (Basis-Varianten-Ableitung). Diese bleiben als Historie
bestehen, beschreiben aber nicht mehr den Ist-Zustand.

## Kontext

Der read-only Modifier-Browser soll je Item-Typ und Basis die rollbaren Mods
mit Tier, Rollen-Bereich und Spawn-Gewicht zeigen. Der repoe-fork-Export (und
ebenso der PoB-Export) enthält aber keine echten Spawn-Gewichte: PoE2 legt sie
nicht offen, alle Werte stehen auf 1. Damit lässt sich keine sinnvolle
Wahrscheinlichkeit berechnen.

Craft of Exile (CoE) rekonstruiert die Gewichte aus Trade-Listings und dem
Recombinator und normalisiert sie. Die Werte sind damit Schätzungen, aber die
einzige verfügbare Quelle für variable, realistische Gewichte pro Basis.

## Entscheidung

- Quelle der Wahrheit für die Gewichte ist ein versionierter CoE-Snapshot unter
  `data/_source/coe/`. Automatischer Abruf ist nicht möglich (privater
  Endpunkt, Org-Netzsperre); der Snapshot wird per Upload aktualisiert und liegt
  nicht im Deploy (das Build-Plugin schließt `data/_source` aus).
- `scripts/import-coe.ts` (`npm run import:coe`) normalisiert den Snapshot in ein
  basis-zentriertes Schema unter `data/<version>/` (aktuell `0.5.4`):
  - `item_types.json` – Item-Typen mit ihren Basis-Varianten (Basis-Id + Label),
  - `mods.json` – schlanke Mod-Metadaten (Text als Vorlage mit `#`, Slot,
    Gruppe, Tags),
  - `base_mods.json` – je Basis die rollbaren Mods mit ihren Tiers (Itemstufe,
    Gewicht, Rollen-Bereiche `values`).
- Zod-Schemas in `src/data/schema.coe.ts` sind die Quelle der Wahrheit; TS-Typen
  per `z.infer`. Import und App validieren dagegen.
- Anders als beim repoe-Schema hängen die Gewichte an der Basis, nicht am Mod.
  Damit entfällt die Tag-basierte Eignung („erster passender Tag gewinnt", ADR
  0004) und die Ableitung der Varianten aus Tag-Schnittmengen (ADR 0006): die
  Varianten stehen direkt in `item_types.json`.
- Neue Engine `src/lib/query/baseEngine.ts` (`runBaseQuery`): jeder bei der
  Itemstufe erreichbare Tier (ilvl ≤ Itemstufe) ist ein eigener gewichteter,
  konkurrierender Eintrag. Chance je Tier = Tier-Gewicht / Slot-Pool; Gruppe =
  Summe der erreichbaren Tier-Gewichte / Slot-Pool. Höchstes ilvl = Tier 1.
- Der Schätzwert-Charakter wird in der Oberfläche kenntlich gemacht: ein Hinweis
  im Modifier-Browser nahe den Werten und eine globale Fußzeile mit Attribution
  (Quelle Craft of Exile, Link) samt Datenstand aus dem Manifest.

## Konsequenzen

- Bei neuem Patch: neuen CoE-Snapshot nach `data/_source/coe/` legen,
  `npm run import:coe` laufen lassen, `data/<neue-version>/` und `manifest.json`
  fortschreiben, committen. Keine Datenbank, kein Server.
- Die Gewichte sind ausdrücklich Schätzwerte; sie können je Snapshot schwanken
  und bei dünner Datenlage (z. B. seltene Mods) ungenau sein. Im aktuellen
  Snapshot wirken manche Werte wie Platzhalter (bei den Ringen durchweg 1000) –
  das ist Datenqualität des Snapshots, nicht der Verdrahtung.
- Mod-Texte bleiben Original-Spieltext (Englisch), als Vorlage mit `#`; die
  Rollen-Bereiche werden pro Tier aus `values` eingesetzt.
- Uniques und Nicht-Item-Domains bleiben draußen (unverändert).
