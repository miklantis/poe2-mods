# ADR 0019 – Augment/Bonded zeigen ihre Quellen (aufklappbar)

Status: akzeptiert (2026-07-08)
Datum: 2026-07-08

Ergänzt ADR 0016 (Augment/Bonded/Warp-Import) und ADR 0018 (mehrzeilige Mods).

## Kontext

poe2db zeigt zu jedem Augment-/Bonded-Effekt, welche Sockelbaren ihn in welcher
Stufe und mit welchem Wert geben (z. B. „Adds # to # Fire Damage": Lesser Rune
4–6, Rune 7–11, Greater Rune 13–16, Perfect Rune 17–20). Unser Import
verdichtete bisher alle beitragenden Sockelbaren zu einer Familienzeile –
konkret bei gleichem Wert, sonst mit `#` – und verwarf dabei Stufe, benötigtes
Level und den konkreten Wertebereich je Quelle.

Die Daten dafür liegen bereits in der repoe `augments.json`: die Stufen sind
eigene Einträge (`RuneFireLesser`, `RuneFire`, `RuneFireGreater`,
`RuneFirePerfect`) mit konkretem `stat_text`, `type_name` und `required_level`.
Marketing-Namen (z. B. „Desert Rune") führt der Export nicht.

## Entscheidung

Ein Augment-/Bonded-Eintrag behält den Familienkopf (`text` mit `#`) und bekommt
eine Liste `sources`. Je Quelle:

- `label`: ableitbar aus Stufe (`Lesser`/`Greater`/`Perfect`/keine, aus dem
  Metadaten-Schlüssel) plus Typ (`type_name`, z. B. „Rune", „Soul Core",
  „Idol") – etwa „Lesser Rune", „Greater Rune", „Soul Core". Bewusst keine
  Marketing-Namen, da sie im Export fehlen und für Spezial-/nummerierte
  Schlüssel nicht verlässlich ableitbar wären.
- `level`: `required_level` (fehlt es, gilt 1).
- `text`: der konkrete Wert-Text (mehrzeilige Kopplungen bleiben zusammen,
  ADR 0018).

Quellen werden je Familie dedupliziert (gleiche Bezeichnung, Level, Wert) und
nach Level, dann Text sortiert. Es werden **alle** beitragenden Sockelbaren
gezeigt – vollständiger als poe2db, das je Rune-Linie ein eigenes Popup führt.

Die Anzeige (`AugmentColumn`) ist jetzt eine aufklappbare Tabelle wie der
rollbare Pool (`ModTable`): Kopfzeile mit Familien-Text und Chevron, darunter je
Quelle eine Zeile mit Bezeichnung, konkretem Wert und Level. Kein Popup. Der
Aufklapp-Zustand läuft über denselben `expandedKeys`-Mechanismus wie die übrigen
Spalten (Namensräume `aug`/`bon`).

## Konsequenzen

- Man sieht je Effekt, welche Sockelbaren-Stufe welchen Wert ab welchem Level
  gibt – das bisher ungenutzte `required_level` wird sichtbar.
- Schema erweitert (`augmentSourceSchema`, `sources` an `augmentEntrySchema`);
  `augments.json` für alle 30 Typen neu erzeugt. Familien-Zählung unverändert
  gegenüber 0.16.3 (1530 Augment-, 903 Bonded-Familien).
- Der Filter (Suche, Tags) wirkt weiter auf Familienebene; die Quellen fahren
  unverändert mit.
- Marketing-Namen der Runen/Cores bleiben offen; sie ließen sich später aus den
  Basis-Items der Sockelbaren nachrüsten, falls gewünscht.
