# ADR 0016 – Augment-, Bonded- und Rune-Magnituden-Abschnitte

Status: akzeptiert (2026-07-08)
Datum: 2026-07-08

Ergänzt ADR 0011 (Datenquelle repoe) und ADR 0013 (Basis-Welten/Domains).

## Kontext

poe2db zeigt je Item-Typ neben Basis-Präfix/Suffix, Desecrated, Essence und
Corrupted noch drei weitere Modifier-Bereiche, die der Browser bisher nicht
hatte:

- Rune-Magnituden (auf poe2db „of Destruction“/„Thrud's“): Präfix/Suffix, die
  die Magnitude der Explicit-Modifier erhöhen, mit Wertebereich.
- Augment: der Effekt einer eingesetzten Rune/Soul Core, abhängig vom Item-Typ.
- Bonded: der Effekt eines gebundenen Talismans, ebenfalls typ-abhängig.

Die drei liegen an zwei verschiedenen Stellen im Export und passen nicht
einheitlich in die bestehende Query-Engine.

## Entscheidung

### Rune-Magnituden als eigene Herkunft `warp` (aus `mods.json`)

Die „of Destruction/Thrud's“-Familie steckt bereits in `mods.json` (Domain
`item`, Präfix/Suffix, Wertebereich), gesetzt aber über den Spawn-Tag
`destruction`, nicht über Basis-Tags. Bisher fielen sie als `rollable` in den
Import und wurden mangels passender Basis nie gezeigt.

`import-repoe.ts` weist ihnen jetzt die Herkunft `warp` zu (Signal: positiver
Spawn-Tag `destruction`). Da sie an keiner Basis über Tags hängen, wählt die
Engine sie über eine eigene Funktion `warpGroups` ohne Basis-Abgleich; die
Itemstufe wirkt wie beim rollbaren Pool. Neun Familien (2 Präfix, 7 Suffix).

### Augment/Bonded aus `augments.json` (neue Datei, invertiert)

`augments.json` beschreibt Socketables (Runen, Soul Cores, Talismane) und ihren
Effekt je Item-Kategorie. Der Browser zeigt pro Item-Typ, also invertiert
`import-augments.ts` die Datei zu `data/<version>/augments.json`: je
Ausrüstungs-Typ eine Liste `augment` (Feld `stat_text`) und `bonded` (Feld
`bonded_stat_text`).

Zuordnung Item-Typ → Augment-Kategorie über Klassen-Token (TYPE_TOKENS /
CAT_TOKENS): ein Effekt gilt, wenn sich die Token der Kategorie („Martial
Weapon“, „Armour“, „Wand or Staff“, „All Equipment“ …) mit denen des Typs
schneiden. Effekte sind fest (kein Tier/Slot/Itemstufe); variiert der Wert
zwischen Rune-Stufen, wird die Familie mit `#`-Platzhaltern gezeigt, sonst der
konkrete Text. `filterTags` werden aus dem Effekt-Text abgeleitet, damit die
Tag-Pills auch hier greifen.

Sonderfall Talisman: er zieht zusätzlich aus dem Waffen- und Rüstungs-Pool, um
mit poe2db deckungsgleich zu sein (dort erscheinen auf der Talisman-Seite
generische Waffen- und Rüstungs-Rune-Effekte). Alle anderen 36 Typen sind
eindeutig einer Waffen-/Rüstungs-Kategorie zugeordnet.

Nur Ausrüstung erhält die Abschnitte (Waffen, Rüstung, Offhands, Schmuck); für
Flasks, Juwelen, Relics, Waystones und Tablets gibt es keinen Eintrag.

### Darstellung

Drei zusätzliche Abschnitte in poe2db-Reihenfolge: Rune-Magnituden direkt nach
dem rollbaren Pool (als Präfix/Suffix-Spalten über `ModColumn`), Augment und
Bonded nach Essence als flache Listen über die neue `AugmentColumn`. Der
gemeinsame Filter (Suche, Tags) wirkt auf alle drei; der Itemstufen-Regler nur
auf Rune-Magnituden (Augment/Bonded kennen keine Stufe).

## Konsequenzen

- Kein Simulator, weiterhin read-only. Zwei Import-Strecken statt einer; die
  Datenversion bleibt 4.5.4.3 (additive Ergänzung, kein Cache-Namen-Sprung; SWR
  aus ADR 0014 liefert das geänderte `mods.json` beim nächsten Laden nach).
- Bei neuem Patch: nach `import:repoe` auch `import:augments` laufen lassen.
- Die Item-Typ→Kategorie-Zuordnung ist eine Heuristik über bekannte
  PoE2-Klassen; neue oder umbenannte Kategorien im Export müssen in CAT_TOKENS
  bzw. TYPE_TOKENS ergänzt werden (unbekannte Typen erhalten sonst keine
  Abschnitte).
