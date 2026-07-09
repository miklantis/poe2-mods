# ADR 0021 – Corrupted-Modifier bei Relics: datentreu (nur was repoe führt)

Status: akzeptiert (2026-07-09)
Datum: 2026-07-09

Ergänzt ADR 0011 (Datenquelle repoe, mod-zentriertes Schema) und ADR 0017
(Eignung ignoriert Domänen-Marker und `default`). Baut auf 0.17.4 auf, wo der
einzige corrupted Relic-Mod erst sichtbar wurde.

## Kontext

Für Relics zeigt poe2db zwei Corrupted-Blöcke: einen sanctum-eigenen Modifier
(erhöhte Resolve-Wiederherstellung, `SanctumResolveRecovery`) sowie einen Block
"Orb of Sacrifice" mit sieben generischen Corruption-Implicits (Chaos-, Kälte-,
Feuer-, Blitz-Resistenz und die drei Attribute).

Der Browser zeigte nach 0.17.4 nur den einen sanctum-eigenen Corrupted-Mod. Es
wurde geprüft, ob die sieben Orb-of-Sacrifice-Mods fehlen.

Befund aus dem repoe-Export (4.5.4.3):

- In `mods.json` gibt es genau einen corrupted Mod der Domäne `sanctum_relic`:
  `SanctumResolveRecovery`.
- Die generischen Corruption-Implicits (`CorruptionChaosResistance1`,
  `CorruptionFireResistance1`, `CorruptionStrength1` usw.) existieren nur in der
  Domäne `item` und tragen konkrete Ausrüstungs-Slot-Tags (`body_armour`,
  `ring`, `belt`, `boots`, `amulet`), aber keinen `sanctum_relic`-Tag.
- Auch `mods_by_base.json` – die maßgebliche Basis→Mods-Zuordnung von repoe –
  führt für alle drei Relic-Größen (small/medium/large) als einzigen corrupted
  Eintrag `SanctumResolveRecovery`.

Die Orb-of-Sacrifice-Zuordnung ergibt sich also nicht aus den Mod-Spawn-Daten,
sondern aus der Currency-Mechanik (Orb of Sacrifice fügt Relics einen zufälligen
generischen Corruption-Implicit hinzu). poe2db bildet diese Mechanik ab; die
repoe-Spieldaten verknüpfen diese Mods nicht mit Relic-Basen.

## Entscheidung

Es bleibt datentreu: Relics zeigen nur die Corrupted-Modifier, die repoe für die
`sanctum_relic`-Domäne führt (aktuell `SanctumResolveRecovery`). Die sieben
Orb-of-Sacrifice-Implicits werden **nicht** manuell ergänzt.

Begründung: Die verbindliche Struktur kommt aus den Daten, nicht aus poe2db
(Projektprinzip). Eine hartkodierte Sonderregel „diese sieben item-Corruptions
gehören auch auf Relics" wäre eine gegen die Datenquelle erfundene Zuordnung,
müsste bei jedem Patch von Hand gepflegt werden und würde das Prinzip der
datengetriebenen Eignung unterlaufen.

## Konsequenzen

- Der Corrupted-Abschnitt bei Relics ist bewusst schlank (ein Mod). Das ist
  kein Bug, sondern der vollständige repoe-Stand.
- Sollte eine künftige repoe-Version die Orb-of-Sacrifice-Zuordnung in
  `mods.json`/`mods_by_base.json` aufnehmen (mit `sanctum_relic`-Tag), erscheinen
  die Mods automatisch – ohne Codeänderung.
- Die Entscheidung gilt sinngemäß für andere isolierte Welten (Tablets,
  Waystones): gezeigt wird, was die Daten hergeben.
