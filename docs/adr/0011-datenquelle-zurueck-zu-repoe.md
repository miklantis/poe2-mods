# ADR 0011 – Zurück zu repoe als Datenquelle (Vollständigkeit statt Wahrscheinlichkeit)

Status: akzeptiert (2026-07-03)
Datum: 2026-07-03

Löst ab: ADR 0008 (Datenquelle Craft of Exile). ADR 0009 (Herkunft-Dimension)
und ADR 0010 (Anzeige-Einheit Modifier) gelten sinngemäß weiter, beziehen sich
im Wortlaut aber auf das CoE-Schema.

## Kontext

ADR 0008 hatte die Datenquelle auf Craft of Exile (CoE) umgestellt, um variable,
geschätzte Spawn-Gewichte und damit Wahrscheinlichkeiten zeigen zu können. Im
Betrieb zeigte sich: Der CoE-Snapshot ist unvollständig. Ihm fehlen ganze Pools
der aktuellen Liga, insbesondere die Genesis-Tree-Modifier (auf Ringen, Gürteln,
Amuletten über die Spawn-Tags `genesis_tree_caster` / `genesis_tree_minion`).
Das ist eine Datenlücke der Quelle, kein Import-Fehler.

Der repoe-Export (`repoe-fork/poe2`, aus den Spieldateien) deckt alle Pools
vollständig ab, legt aber nur binäre Spawn-Gewichte offen (0/1: ein Modifier
kommt auf einer Basis vor oder nicht). Damit lässt sich keine Wahrscheinlichkeit
berechnen.

## Entscheidung

Rückkehr zu repoe als Quelle der Wahrheit. Der Trade-off ist bewusst zugunsten
der Vollständigkeit: Die Chance-/Wahrscheinlichkeits-Anzeige entfällt
durchgängig. Alle Herkünfte (rollbar, Desecrated, Essence, Corrupted) werden
einheitlich mit Tier und Wertebereich gezeigt, ohne Gewicht und ohne Chance.

Konkret:

- Neues, mod-zentriertes Schema (`schema.repoe.ts`): Tiers hängen am Modifier
  (id, Itemstufe, Werte-Bereiche), Eignung über Tags (Abgleich Basis-Tags gegen
  Mod-Tags), kein Gewichtsfeld. `base_items.json` trägt die Basis-Tags.
- Import `import-repoe.ts` zieht `repoe-fork/poe2` (Version 4.5.4.3) und
  gruppiert die repoe-Einträge zu Familien nach `origin` + `slot` + `type`.
- Herkünfte in repoe: rollbar = `domain item` mit `generation_type`
  prefix/suffix (inkl. Genesis-Tree über die Tags), Corrupted =
  `generation_type corrupted`, Desecrated = `domain desecrated` (Boss-Tags
  ulaman/amanamu/kurgal), Essence siehe unten.
- Reine Engine `repoeEngine.ts`: `runRepoeQuery` (Eignung + Tier-Rangfolge über
  requiredLevel), einheitliche flache Logik für alle Herkünfte.

## Essence

repoe-poe2 führt keine Essence→Mod-Zuordnung (die `generation_type essence`-
Einträge sind Monster-Definitionen). Um den Essence-Abschnitt (Phase 7) nicht zu
verlieren, wird er einmalig aus dem vorhandenen CoE-Snapshot aufbereitet
(`import-essences-coe.ts`): CoE-Essence-Einträge je Basis werden zu einer Liste
je repoe-Item-Klasse verdichtet (Brücke: CoE-Item-Typname == repoe-Klassen-ID).
Das Ergebnis (`essences.json`) ist selbst-enthaltend. Die Herkunft ist als CoE
gekennzeichnet (Fußzeile). Fällt später eine repoe-Essence-Quelle an, wird das
neu bewertet.

## Konsequenzen

- Keine Wahrscheinlichkeits-Anzeige mehr; die Oberfläche ist einheitlicher und
  ehrlicher (keine Schätzwerte mehr im rollbaren Pool).
- Vollständige Pools inkl. der zuvor fehlenden Genesis-Tree-Mods.
- „Otherworldly" (im PLAN als fehlend vermutet) ist kein Ausrüstungs-Pool,
  sondern Karten-/Tablet-Inhalt; damit für den Ausrüstungs-Browser gegenstandslos.
- CoE-Reste (`import-coe.ts`, `schema.coe.ts`, `baseEngine`/`essenceEngine`,
  `data/0.5.4`, `data/_source/coe`) werden in einem Aufräum-Schritt entfernt; das
  Essence-Artefakt bleibt.
