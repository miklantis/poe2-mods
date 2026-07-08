# ADR 0020 – Echte Sockelbaren-Namen als Quellen-Bezeichnung

Status: akzeptiert (2026-07-08)
Datum: 2026-07-08

Ergänzt ADR 0019 (Augment/Bonded-Quellen) und löst dessen Verzicht auf
Marketing-Namen ab.

## Kontext

ADR 0019 zeigte je Augment-/Bonded-Quelle eine abgeleitete Bezeichnung aus Stufe
plus Typ („Lesser Rune", „Soul Core", „Idol") und verzichtete auf die echten
Item-Namen, weil `augments.json` sie nicht führt. Bei Runen genügt das (Stufe +
Wert + Level identifizieren die Quelle), bei Idols und Soul Cores aber nicht:
diese haben keine Stufen, jedes ist ein eigenes benanntes Item, und „Idol"
allein sagt nichts darüber, welches.

Die Namen stehen in der repoe `base_items.json`, unter demselben
Metadaten-Schlüssel wie in `augments.json`, inklusive Stufe – z. B.
`RuneFireLesser` → „Lesser Desert Rune", `IdolCorrupted2` → „Idol of the
Martyr", `AmanamusGaze` → „Amanamu's Gaze".

## Entscheidung

Der Augment-Import zieht zusätzlich `base_items.json` und nutzt den echten
Item-Namen als Quellen-Bezeichnung. Fehlt ein Name, greift weiterhin die
abgeleitete Bezeichnung (Stufe + Typ) aus ADR 0019. Der Name enthält die Stufe
bereits, daher entfällt dann die separate Stufen-Ableitung.

## Konsequenzen

- Jede Quelle nennt das konkrete Sockelbare (z. B. „Perfect Desert Rune", „Idol
  of Thruldana", „Amanamu's Gaze") – deckt sich mit poe2db. Im aktuellen Export
  bekommen alle 4483 Quellen einen echten Namen; der Fallback bleibt als
  Absicherung.
- Zusätzlicher Fetch von `base_items.json` in `import-augments.ts`; keine
  Schema-Änderung (Feld `label` bleibt). `augments.json` neu erzeugt.
- Der Import hängt jetzt an zwei repoe-Dateien (`augments.json`,
  `base_items.json`); beide liegen im selben Export.
