# ADR 0015 – Filter-Tags auch für den Essence-Abschnitt

Status: akzeptiert (2026-07-08)
Datum: 2026-07-08

Ergänzt ADR 0011 (Datenquelle repoe, Essence aus CoE-Snapshot).

## Kontext

Der Tag-Filter (Filter-Pills wie „Attribut“, „Feuer“, „Resistenz“) behält eine
Anzeige-Gruppe nur, wenn ihre `filterTags` mindestens einen aktiven Tag
enthalten. Essence-Einträge trugen jedoch keine `filterTags`: das
`essenceEntrySchema` führte das Feld nicht, und die Engine setzte in
`essenceGroups` fest `filterTags: []`. Folge: sobald ein Tag-Filter aktiv war,
verschwand der komplette Essence-Abschnitt – auch offensichtlich passende
Einträge wie „+# to Strength“ unter „Attribut“.

Ursprünglich war das eine bewusste Vereinfachung mit der Begründung, Essence
werde über die Item-Klasse gewählt und nicht über Tag-Eignung. Das vermischt
aber die zwei getrennten Tag-Felder: `tags` (Eignung, Abgleich gegen die
Basis-Tags) und `filterTags` (rein beschreibend, speist die Pills). Für Essence
darf die *Eignung* leer bleiben, die *beschreibenden* Tags nicht.

## Entscheidung

Essence-Einträge tragen jetzt `filterTags`. Quelle ist der bereits vorhandene
CoE-Snapshot: dessen `mods.json` führt je Mod passende Tags in genau der
Filter-Sprache (`attribute`, `fire`, `cold`, `resistance`, `elemental` …). Der
Essence-Import löst jeden Eintrag ohnehin über diese CoE-Mods per id auf und
übernimmt deren Tags nun als `filterTags`. Die Engine reicht sie in
`essenceGroups` durch; `tags` (Eignung) bleibt weiterhin leer.

Damit greift der Tag-Filter über alle Herkünfte mit demselben Vokabular. Von 530
Essence-Einträgen bekommen 398 mindestens einen Tag; der Rest (z. B. Runic Ward,
Spirit, Block) ist auch in den Rohdaten ungetaggt und verhält sich wie ein
ungetaggter rollbarer Mod – bei aktivem Tag-Filter fällt er heraus.

## Konsequenzen

- Keine neue Datenquelle und kein UI-Umbau: der Fix nutzt bereits vorhandene
  CoE-Tags. `essences.json` wurde einmalig über `npm run import:essences` neu
  erzeugt.
- Interne Unter-Tags (`fire_resistance`, `defences` …) landen zwar in den
  Rohdaten, werden aber wie überall von `displayTags` auf die primären Pills
  reduziert (`resistance`, `fire` bleiben) – konsistent zum rollbaren Pool.
- Bei künftigen Datenupdates bleibt der Ablauf gleich; `filterTags` fließt
  automatisch aus dem Import.
