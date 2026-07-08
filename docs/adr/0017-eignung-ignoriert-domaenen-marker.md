# ADR 0017 – Eignung ignoriert Domänen-Marker und `default`

Status: akzeptiert (2026-07-08)
Datum: 2026-07-08

Ergänzt ADR 0011 (Datenquelle repoe, mod-zentriertes Schema) und ADR 0013
(Multi-Domänen-Import mit `__dom_<domain>`-Markern).

## Kontext

Ob eine Modifier-Familie auf eine Basis passt, entscheidet `modFitsBase`: die
Familie passt, wenn sie mit der Basis mindestens einen Tag teilt (Basis-Tags
gegen `mod.tags`). Der Multi-Domänen-Import (ADR 0013) legt zur Isolierung der
Domänen einen unsichtbaren Marker `__dom_<domain>` (z. B. `__dom_item`) sowohl
auf die Basen als auch auf die zugehörigen Mods. Zusätzlich trägt nahezu jede
Basis den `default`-Tag.

Beim QA-Gegencheck der Claws fiel auf, dass sieben Corrupted-Modifier auf Claws
erschienen, die dort nicht hingehören: einzelne Attribut- und Resistenz-Vaal-
Implizite, deren echte Eignungs-Tags Rüstung/Schmuck sind (`body_armour`,
`ring`, `belt`, `boots`, `amulet`), aber kein Waffen-Tag. Sie trafen die
Claw-Basis allein über den gemeinsamen Marker `__dom_item`. `modFitsBase`
wertete den Isolations-Marker also als echtes Eignungssignal – genau das
Gegenteil seines Zwecks.

Warum nur Corrupted betroffen war: Die rollbaren Mods der `item`-Domäne tragen
`__dom_item` nach dem Import nicht mehr als Eignungs-Tag (sie haben echte
Slot-Tags); die sieben Corrupted-Mods hatten `__dom_item` als einzigen
Berührungspunkt zur Claw-Basis. `default` war bereits beim Import als
Eignungssignal ausgeschlossen worden, lag aber weiterhin auf den Basen.

## Entscheidung

`modFitsBase` zählt einen geteilten Tag nur noch, wenn er ein echter
Eignungs-Tag ist. Nicht als Eignung gewertet werden:

- alle Marker mit `__`-Präfix (die Domänen-Isolationsmarker `__dom_*`),
- der überall vorhandene `default`-Tag.

Umgesetzt über ein kleines Prädikat `isEligibilityTag` in `repoeEngine.ts`; die
Prüfung überspringt solche Tags, egal ob sie auf Mod- oder Basis-Seite stehen.
`warpGroups` (Abgleich über die Themen-Tags) und `essenceGroups` (Auswahl über
die Item-Klasse) sind nicht betroffen.

## Konsequenzen

- Die sieben fälschlich auf Waffen (und analog über Kreuz auf andere
  `__dom_item`-Basen) gezeigten Corrupted-Implizite verschwinden. Für Claws
  deckt sich der Corrupted-Abschnitt jetzt mit poe2db (9 statt 16).
- Kein Datenumbau: der Fix sitzt allein in der Eignungslogik. Rollbarer und
  Desecrated-Pool bleiben unverändert (für Claws 8/14 bzw. 3/3).
- Der Import muss den `__dom_*`-Marker nicht mehr sorgfältig aus jedem
  Mod-Tagsatz entfernen; die Engine ignoriert ihn ohnehin. Neue Domänen-Marker
  sind damit von vornherein eignungsneutral.
- Regressionstests in `repoeEngine.test.ts`: Eignung allein über `default` oder
  über einen `__dom`-Marker schlägt fehl; der konkrete Claw/Corrupted-Realfall
  ist als Test hinterlegt.
