# ADR 0004 – Query-Engine: fachliche Regeln

Status: abgeloest durch ADR 0008 (Datenquelle Craft of Exile)
Datum: 2026-07-03

## Kontext

Tier und Wahrscheinlichkeit liegen bewusst nicht in den Daten, sondern werden
berechnet (siehe ADR 0003). Die Berechnung ist das Herz der App und soll ein
reines, DOM-freies, testbares Modul sein. poe2db (ModifiersCalc) ist das
funktionale Vorbild.

## Entscheidung

Das Modul `src/lib/query/engine.ts` bildet den Rechen-Kern. `runQuery` nimmt ein
Item-Tag-Set plus Itemstufe und liefert Präfixe und Suffixe je Gruppe.

- Eignung: „erster passender Tag gewinnt" – die `spawnWeights` werden in
  Reihenfolge geprüft; der erste Eintrag, dessen Tag das Item hat, liefert das
  Gewicht. Gewicht 0 oder kein Treffer schließt den Mod aus.
- Tier: feste Rangfolge innerhalb Gruppe plus Slot, nach `requiredLevel`
  absteigend (Tier 1 = höchstes Level), stabiler Tiebreak über die
  Ausgangsreihenfolge. Die Rangfolge wird über den vollen tag-erreichbaren Pool
  gebildet und ist damit unabhängig vom Itemstufen-Filter stabil.
- Itemstufe filtert: Mods über der Stufe fallen aus dem Pool, wie der Slider bei
  poe2db.
- Wahrscheinlichkeit: pro Slot ein eigener Pool; Anteil = Gewicht geteilt durch
  die Summe der erreichbaren Gewichte des Slots. Zusätzlich je Gruppe die Summe.
- Facet-Filter (Tag-Pills, Präfix/Suffix-Toggle) bleiben aus der Engine draußen
  und kommen in Phase 4 als Schicht darüber. Die Engine bleibt auf Eignung, Tier
  und Wahrscheinlichkeit beschränkt.

## Konsequenzen

- Die UI reicht das Tag-Set der gewählten Basis in die Engine; die Engine ist von
  der Basis-Auswahl entkoppelt und rein testbar.
- Tier bleibt stabil, auch wenn niedrige Itemstufe höhere Tiers ausblendet.
- Gruppen mit Einträgen in beiden Slots (aktuell drei) erhalten je Slot eine
  eigene Tier-Leiter.
