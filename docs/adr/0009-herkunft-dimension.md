# ADR 0009 – Herkunft-Dimension (rollbar, Corrupted, Desecrated, Essence)

Status: akzeptiert (2026-07-03)
Datum: 2026-07-03

Baut auf ADR 0008 (Datenquelle Craft of Exile) auf.

## Kontext

Der Browser zeigte bisher nur den normalen, gewichteten Basis-Pool (rollbare
Präfixe und Suffixe). Path of Exile 2 kennt aber weitere Wege, einen Modifier
auf ein Item zu bringen. poe2db bildet sie im ModifiersCalc als eigene Bereiche
ab, nicht als Zeilen der Präfix/Suffix-Liste. Relevant für uns:

- Corrupted – über Corruption (Vaal), belegt keinen Präfix/Suffix-Slot.
- Desecrated – über Desecration (Well of Souls), als Präfix/Suffix gesetzt.
- Essence – garantierte Mods je Item-Typ.

Im CoE-Snapshot ist die Herkunft sauber über die Modifier-Gruppe `mgroup`
kodiert: `Base` (id 1), `Desecrated` (id 10), `Essence` (id 13). Corrupted
steckt als eigener `affix`-Wert in der Base-Gruppe. Socket-Mods (Runen,
Seelenkerne) liegen ebenfalls in der Base-Gruppe.

## Entscheidung

- Neue Dimension **Herkunft** (`origin`) am Mod: `rollable | corrupted |
  desecrated`. Sie ist die Reiter-Achse im Browser. Weitere Herkünfte (Essence)
  kommen als eigener Datenweg dazu.
- Die Herkünfte zerfallen in **zwei Bauarten**:
  - Basis-gebunden: rollbar, Corrupted, Desecrated. Sie hängen wie die normalen
    Mods über `base_mods` an einer Basis (Tiers mit Itemstufe/Gewicht/Werte) und
    passen ins bestehende Schema. Unterschied ist nur die Herkunft-Kennung.
  - Garantiert je Item-Typ: Essence. Kein Spawn-Gewicht, keine Basis-Bindung im
    gleichen Sinn – braucht einen eigenen, item-typ-bezogenen Datenweg (folgt).
- `mods.json` trägt `origin` und einen nullable `slot`: Corrupted-Mods haben
  `slot: null`, weil sie keinen Präfix/Suffix-Slot belegen.
- Die Rechen-Engine `runBaseQuery` bleibt herkunftsagnostisch, verarbeitet aber
  nur Mods mit Slot (überspringt `slot: null`). Die Herkunft-Trennung passiert
  davor über die reine Funktion `filterRowsByOrigin`: jeder Reiter bekommt nur
  die Zeilen seiner Herkunft, damit sich die Pools nie mischen.
- **Chance nur bei rollbar.** Corrupted und Desecrated sind gezielt bzw.
  garantiert gesetzt und haben keine sinnvolle Spawn-Wahrscheinlichkeit (im
  Snapshot Gewicht 1 als Platzhalter). Ihre Reiter zeigen nur Tier und
  Rollen-Bereich, keine Chance.
- **UI-Reiter je Herkunft**, je Item-Typ nur die vorhandenen. rollbar und
  Desecrated als Präfix/Suffix-Spalten; Corrupted flach ohne Slot-Trennung.
  (Baut im nächsten Schritt auf diesem Fundament auf.)

## Ausdrücklich ausgeschlossen

- Socket-Mods (Runen/Seelenkerne, ca. 471) – bewusst nicht aufgenommen.
- Augment und Bonded – im Snapshot 0.5.4 nicht als eigene Herkunft vorhanden
  (nur vereinzelte Texttreffer, keine Klasse). Zurückgestellt, bis ein Snapshot
  sie als eigene Gruppe führt; erst dann ist ihre Struktur ableitbar.

## Konsequenzen

- Der Import (`scripts/import-coe.ts`) nimmt jetzt `mgroup` 1 (rollbar +
  Corrupted) und `mgroup` 10 (Desecrated) auf; Socket und Essence bleiben
  vorerst draußen. Neue Item-Typen werden weiterhin nur aus Basen mit rollbaren
  Mods abgeleitet, damit Sonder-Herkünfte keine leeren Typen erzeugen.
- Der rollbare Pool ist unverändert (gleiche Mod- und Zeilenmenge wie zuvor,
  an den Ringen gegengeprüft). Der bestehende Browser-Screen filtert strikt auf
  `origin: rollable`.
- Datenzuwachs im Snapshot 0.5.4: 491 rollbar, 100 Corrupted, 204 Desecrated.
