# 0006 – Basis-Varianten datengetrieben ableiten

## Status
Angenommen (2026-07-03)

## Kontext
Screen 2 (Modifier-Browser) braucht ein Tag-Set fuer `runQuery`. Manche
Item-Typen haben genau eines (Ringe: `ring`, `default`), andere zerfallen in
mehrere Pools mit unterschiedlichen rollbaren Mods:

- Ruestung nach Attribut (`str_armour`, `dex_armour`, `int_armour` und Kombis),
- Caster-Waffen mit Spell-Restriktionen (`no_fire_spell_mods` usw.),
- dazu nicht-craftbare Spezialbasen (`not_for_sale`, `demigods`), die keine
  eigene, waehlbare Variante sein sollen.

Die verbindliche Struktur soll aus den Daten kommen, nicht aus einer Handliste.

## Entscheidung
`deriveVariants(baseItems, itemClass)` (`src/lib/baseVariants.ts`, DOM-frei,
getestet) leitet die Varianten so ab:

1. Spezialbasen mit `not_for_sale` oder `demigods` werden ausgeschlossen. Bleibt
   dann nichts uebrig, wird auf alle Basen zurueckgefallen.
2. Basen werden nach ihren unterscheidenden Tags gruppiert – ohne Rauschen
   (`default`, `runeforged`) und ohne `*_basetype`-Tags.
3. Die kanonischen Tags einer Variante sind die Schnittmenge der vollen
   Tag-Listen ihrer Basen. Das entfernt basetype-spezifisches Rauschen und
   liefert den generischen Pool – dieselbe generische Sicht wie der
   ModifiersCalc auf poe2db, der ebenfalls keine konkrete Basetype-Herkunft
   annimmt.
4. Labels: Attribut-Varianten bekommen deutsche Attribut-Namen (Staerke,
   Geschicklichkeit, Intelligenz, Kombis) in fester Reihenfolge. Der grosse
   neutrale Pool heisst „Standard" (bei Typen ohne Attribut, z. B. Caster-Waffen,
   steht er vorne) bzw. „Ohne Attribut" (bei Attribut-Typen, dort ein Sonderfall
   hinter den Attribut-Varianten). Restliche Pools (z. B. Spell-restringierte
   Caster-Basen) werden per repraesentativem Basisnamen benannt.

Der Umschalter erscheint nur, wenn es mehr als eine Variante gibt.

## Konsequenzen
- Screen 2 ist fuer alle Item-Typen korrekt, ohne Handpflege je Typ.
- Die generische Schnittmengen-Sicht ignoriert basetype-spezifische
  Gewichtungen bewusst; fuer einen Nachschlage-Browser ist das der richtige
  Default. Eine spaetere Basis-genaue Ansicht bliebe moeglich.
- Das `hasVariants`-Flag in `itemGroups.ts` ist nur noch ein Hinweis fuer die
  Kachel; die tatsaechliche Wahrheit sind die Daten.
