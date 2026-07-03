# ADR 0010 – Anzeige-Einheit ist der Modifier, nicht die Ausschluss-Gruppe

Status: akzeptiert (2026-07-03)
Datum: 2026-07-03

Baut auf ADR 0008 (Datenquelle Craft of Exile) und ADR 0009 (Herkunft-Dimension)
auf.

## Kontext

Die `group` eines Mods im CoE-Snapshot ist eine Ausschluss-Gruppe: ein Item kann
nur einen Modifier je Gruppe tragen. Sie fasst aber teils mehrere
eigenstaendige Modifier-Texte zusammen. Beispiele bei der Wand:

- `IncreaseSocketedGemLevel` (Suffix): Fire, Cold, Lightning, Chaos, Physical und
  „all" Spell Skills – sechs verschiedene Texte.
- `WeaponDamageTypePrefix` (Praefix): die fuenf elementaren Waffen-Schaden-Arten.

Die Engine gruppierte die Anzeige bisher nach `group`. Dadurch fielen diese
verschiedenen Modifier in eine Zeile, ihre Tier wurden vermischt (man sah
scheinbar mehrfach denselben Tier untereinander), und die Chance war ein
Sammelwert ueber die ganze Gruppe. poe2db zeigt jeden dieser Modifier dagegen
als eigene Zeile mit eigenen Tier und eigener Chance.

## Entscheidung

Anzeige-Einheit ist der einzelne Modifier (Mod-ID), nicht die Ausschluss-Gruppe.

- `runBaseQuery` und `runFlatQuery` gruppieren nach Mod-ID statt nach `mod.group`.
  Das Feld `group` von `ModGroup`/`DisplayGroup` traegt jetzt die Mod-ID und
  dient als eindeutiger Anzeige-Schluessel und React-Key.
- Der Slot-Pool (Summe der erreichbaren Tier-Gewichte je Slot) bleibt
  unveraendert; die Chance je Modifier ist die Summe seiner eigenen erreichbaren
  Tier-Gewichte geteilt durch diesen Pool. Die Summe ueber die aufgeteilten
  Zeilen entspricht dem frueheren Gruppenwert.
- Die Daten tragen dies: je Basis ist eine Mod-ID eindeutig, und kein rollbarer
  Text kommt je Basis aus zwei Mod-IDs. Es entstehen keine echten Doppelungen.

## Konsequenzen

- Mehr, aber praezisere Zeilen (Wand: 11 Praefixe / 18 Suffixe statt 7 / 13);
  keine vermischten Tier mehr.
- Die Ausschluss-Gruppe wird derzeit nicht mehr angezeigt. Falls die
  Slot-Konkurrenz spaeter sichtbar gemacht werden soll (Hinweis „teilt Slot mit
  …"), kaeme sie als eigenes, optionales Detail dazu – ausserhalb des jetzigen
  Umfangs.
- Praezisiert die Wahrscheinlichkeits-Regel aus ADR 0004 (dort „je Gruppe";
  jetzt „je Modifier").
