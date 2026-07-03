# CoE-Essence-Quelle (eingefroren)

Minimaler Craft-of-Exile-Snapshot (Version 0.5.4), aus dem der Essence-Abschnitt
einmalig aufbereitet wurde. repoe-poe2 fuehrt keine Essence->Mod-Zuordnung, daher
bleibt Essence aus diesen Daten erhalten (siehe ADR 0011).

- `essences.json` – je CoE-Basis die per Essence garantierten Mods.
- `mods.json` – CoE-Mod-Metadaten (Text, Slot) fuer die Aufloesung.
- `item_types.json` – CoE-Basis -> Item-Typname (Bruecke zur repoe-Klassen-ID).

Erzeugt `data/<repoe-version>/essences.json` via `npm run import:essences`.
Dies ist ein eingefrorenes Artefakt; der CoE-Snapshot wird nicht aktualisiert.
