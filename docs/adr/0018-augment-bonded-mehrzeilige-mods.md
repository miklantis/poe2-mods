# ADR 0018 – Augment/Bonded halten mehrzeilige Mods zusammen

Status: akzeptiert (2026-07-08)
Datum: 2026-07-08

Ergänzt ADR 0016 (Augment/Bonded/Warp-Import).

## Kontext

Der Augment-Import (`scripts/import-augments.ts`) invertiert die repoe
`augments.json` je Item-Typ. Im Rohexport hat jede (Sockelbares, Item-Kategorie)
ein Feld `stat_text` (bzw. `bonded_stat_text`). Ein Sockelbares gibt je
Item-Kategorie **einen** Modifier – dessen Stat-Zeilen können sich aber auf
mehrere Array-Elemente **oder** auf einen String mit `\n` verteilen. Beispiele:
`IdolCorrupted2 / Martial Weapon Wand or Staff` führt zwei Elemente
(`Meta Skills gain … Energy`, `25% reduced Spirit`) für ein und denselben Mod;
`RuneOlrothsLegacy / Helmet` sogar acht Zeilen.

Der bisherige Import schob jedes Array-Element einzeln in einen flachen Text-Pool
und verdichtete danach zu Familien. Damit zerfielen zweizeilige Mods in zwei
unabhängige Einträge. Der QA-Gegencheck (Wands) machte das sichtbar: gekoppelte
Nachteil/Vorteil-Mods wie `-20% to all Elemental Resistances` + `Gain 20% of
Damage as Extra Damage of a random Element` erschienen als zwei eigenständige,
scheinbar einzeln erhältliche Effekte, und die Zählung war aufgebläht (Wand
Augment 53 statt 46, Bonded 41 statt 38; poe2db-Vorbild: 46 bzw. 38).

## Entscheidung

Der Import hält alle Stat-Zeilen einer (Sockelbares, Kategorie) als **einen**
Modifier zusammen: die `stat_text`- bzw. `bonded_stat_text`-Elemente werden mit
`\n` verbunden, bevor sie in den Pool gehen. Die Text-Aufbereitung erhält die
Zeilenstruktur (`cleanText`: Link-Markup weg, je Zeile Leerraum normalisieren,
leere Zeilen verwerfen, mit `\n` verbinden). Gruppierung und `id` laufen über
einen einzeiligen Schlüssel (`labelKey`), der Anzeige-Text bleibt mehrzeilig –
konkret, wenn er über alle Vorkommen gleich ist, sonst als Familien-Text mit
`#`. Das entspricht der Konvention des rollbaren Pools, dessen Kombi-Mods
ebenfalls `\n`-getrennt gespeichert sind.

## Konsequenzen

- Doppel-/Mehrzeilen-Mods erscheinen als ein Eintrag; die Kopplung (oft Nachteil
  plus Vorteil) bleibt erkennbar, und die Zählung stimmt mit poe2db überein
  (Wand Augment 46, Bonded 38; Claw/Dagger Augment 61, Bonded 37).
- `augments.json` wurde für alle 30 Item-Typen neu erzeugt (1530 Augment-, 903
  Bonded-Familien gesamt). Reiner Datenlauf; die Import-Zuordnung
  (TYPE_TOKENS/CAT_TOKENS) bleibt unverändert.
- Die Anzeige nutzt weiterhin `cleanModText`; die `\n` kollabieren im `<td>`
  optisch zu einem Leerzeichen – konsistent mit den Kombi-Mods des rollbaren
  Pools. Ein sichtbarer Zeilenumbruch wäre eine spätere UI-Frage.
- Die Zeilen-Reihenfolge folgt dem Rohexport und kann von poe2db abweichen; das
  ist rein kosmetisch und ohne Bedeutung für den Inhalt.
