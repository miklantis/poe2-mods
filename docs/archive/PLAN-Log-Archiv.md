# PLAN-Log – Archiv

Ausgelagerte, älteste Log-Einträge aus `PLAN.md`. Chronologisch, älteste zuerst.

- 2026-07-03, 0.1.0 – Phase 0 (Setup) abgeschlossen. Grundgerüst, Routing,
  Styling, Deploy-Pipeline und Docs-Struktur stehen; Basis für die Datenpipeline gelegt.
- 2026-07-03, 0.2.0 – Phase 1 (Datenpipeline und Schema) abgeschlossen. Zod-Schema,
  Import-Skript, normalisierte Daten (4.5.4.3), Loader-Hooks mit Validierung und
  Datenstatus-Anzeige. An den Ringen gegen poe2db gegengeprüft.
- 2026-07-03, 0.3.0 – Phase 2 (Query-Engine) abgeschlossen. Reines Modul
  `src/lib/query/engine.ts`: Eignung nach „erster passender Tag gewinnt", Tier je
  Gruppe plus Slot, Itemstufen-Filter, Wahrscheinlichkeit pro Slot. 11 Unit-Tests.
- 2026-07-03, 0.4.0 – Phase 3 gestartet: Design-System eingezogen. Dunkles Theme
  aus dem Handoff als Tokens (Farben, Text-Abstufungen, Präfix-/Suffix- und
  Tag-Farben), drei self-hosted Schriften (Space Grotesk, Manrope, JetBrains
  Mono), Hintergrund-Glow, schlanke Layout-Shell ohne globalen Header. Grundlage
  für die Item-Ansichten.
- 2026-07-03, 0.5.0 – Phase 3, Screen 1: Item-Typ-Auswahl. Gruppiertes
  Kachel-Grid aus den Daten (Config in `itemGroups.ts` liefert Reihenfolge,
  Labels und Icons; Unbekanntes fällt nach „Other"), Substring-Suche,
  Navigation auf die Browser-Route `/$type` (noch Platzhalter). Reine
  Gruppierungslogik mit 6 Tests. Input-Primitive und `ItemTypeTile` als
  wiederverwendbare Bausteine.
