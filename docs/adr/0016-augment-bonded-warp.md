# ADR 0016 – Augment-, Bonded- und Warp-Runen-Abschnitte

Status: akzeptiert (2026-07-08)
Datum: 2026-07-08

Ergänzt ADR 0011 (Datenquelle repoe) und ADR 0013 (Basis-Welten/Domains).

## Kontext

poe2db zeigt je Item-Typ neben Basis-Präfix/Suffix, Desecrated, Essence und
Corrupted noch drei weitere Modifier-Bereiche, die der Browser bisher nicht
hatte:

- Warp-Runen (auf poe2db „GameWarpRune“): sechs Slot-gebundene Runen mit je
  eigenem Präfix/Suffix-Pool (z. B. Thrud's Might: Magnituden; Vorana's Carnage:
  Rage/Warcry).
- Augment: der Effekt einer eingesetzten Rune/Soul Core, abhängig vom Item-Typ.
- Bonded: der Effekt eines gebundenen Talismans, ebenfalls typ-abhängig.

Die drei liegen an zwei verschiedenen Stellen im Export und passen nicht
einheitlich in die bestehende Query-Engine.

## Entscheidung

### Warp-Runen als eigene Herkunft `warp` (aus `mods.json`)

poe2db zeigt je Ausrüstungs-Slot eine „GameWarpRune“. Das sind sechs
Slot-gebundene Warp-Runen mit je eigenem, themengebundenem Präfix/Suffix-Pool:

- Waffen → Thrud's Might (Tag `destruction`, Magnituden)
- Helm → Vorana's Carnage (`berserking`, Rage/Warcry)
- Handschuhe → Kolr's (`marksman`) und Katla's (`decay`)
- Körperrüstung → Medved's (`soul`)
- Stiefel → Uhtred's (`chronomancy`)
- Talisman → wie Waffen (`destruction`), so auch auf poe2db

Die Pools liegen in `mods.json` (Domain `item`, Präfix/Suffix), tragen aber nur
ihren Themen-Tag, keinen Item-Klassen-Tag. Die Slot-Bindung steht in
`augments.json` (`RuneWarping…Influence` → Kategorie). `import-repoe.ts` weist
allen sechs Themen-Tags die Herkunft `warp` zu (früh, vor der Familienbildung,
damit gleichnamige Jewel-Mods desselben `type` nicht mit warp-Mods in eine
Familie verschmelzen). Die Zuordnung Item-Typ → Themen liegt in `lib/warp.ts`;
`warpGroups` wählt je Typ die passenden Themen (kein Basis-Abgleich). Andere
Slots (Schild, Buckler, Focus, Ring, Amulett, Gürtel, Köcher) haben keine
Warp-Rune. 76 Familien über die sechs Themen.

Die vollen Namen von Kolr's, Katla's, Medved's und Uhtred's führt der Export
nicht sauber; sie sind in `WARP_LABEL` vorläufig benannt (Thrud's Might und
Vorana's Carnage sind gesichert).

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

Zusätzliche Abschnitte in poe2db-Reihenfolge: die Warp-Rune(n) direkt nach dem
rollbaren Pool (je Rune ein Präfix/Suffix-Block über `ModColumn`), Augment und
Bonded nach Essence als flache Listen über die neue `AugmentColumn`. Der
gemeinsame Filter (Suche, Tags) wirkt auf alle; der Itemstufen-Regler nur auf
Warp-Runen (Augment/Bonded kennen keine Stufe).

## Konsequenzen

- Kein Simulator, weiterhin read-only. Zwei Import-Strecken statt einer; die
  Datenversion bleibt 4.5.4.3 (additive Ergänzung, kein Cache-Namen-Sprung; SWR
  aus ADR 0014 liefert das geänderte `mods.json` beim nächsten Laden nach).
- Bei neuem Patch: nach `import:repoe` auch `import:augments` laufen lassen.
- Die Item-Typ→Kategorie-Zuordnung ist eine Heuristik über bekannte
  PoE2-Klassen; neue oder umbenannte Kategorien im Export müssen in CAT_TOKENS
  bzw. TYPE_TOKENS ergänzt werden (unbekannte Typen erhalten sonst keine
  Abschnitte).
