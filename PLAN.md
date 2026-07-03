# PLAN – poe2-mods

## Aktueller Stand

Die App läuft (GitHub Pages), Datenquelle Craft of Exile, Version 0.5.4. Sie ist
ein durchsuchbarer, read-only Modifier-Browser: Item-Typ-Auswahl auf der
Startseite, je Typ ein Browser mit allen Herkünften gleichzeitig als Tabellen
(rollbar mit Chance, darunter Desecrated, Essence und Corrupted ohne Chance),
gemeinsamer Facet-Filter (Suche, Tags, Itemstufe) als teil-/bookmarkbarer
URL-State. Phasen 0–7 abgeschlossen (Überblick unten, Detail in ADRs und
Commits).

Laufende und einzige aktive Arbeit: Phase 8 – Migration der Datenquelle zurück
auf repoe. Grund: Der CoE-Snapshot kennt die 0.5-Sonderpools Otherworldly und
Genesis-Tree-Mods nicht (Datenlücke der Quelle, kein Import-Fehler); repoe deckt
alle Pools ab. Preis: repoe legt nur binäre Spawn-Gewichte offen (0/1, an den
Belt-Mods verifiziert), also entfällt die Wahrscheinlichkeits-Anzeige im
rollbaren Pool. Trade-off bewusst zugunsten der Vollständigkeit; ADR 0008 (CoE)
wird damit abgelöst. Bis Phase 8 umgesetzt ist, läuft die App unverändert auf
CoE.

---

## Offene Vorhaben

### Phase 8 – Datenquelle zurück auf repoe (Vollständigkeit statt Wahrscheinlichkeit)
Umstieg vom CoE-Snapshot auf den repoe-poe2-Export (Repo `repoe-fork/poe2`,
Branch `master`, Version 4.5.4.3, aus den Spieldateien; Rohdaten unter
`https://raw.githubusercontent.com/repoe-fork/poe2/master/data/`). Bringt alle
Pools inkl. der bisher fehlenden Otherworldly- und Genesis-Tree-Mods. Kostet die
geschätzten Wahrscheinlichkeiten, weil repoe nur Spawn-Gewichte 0/1 führt; die
Chance-Anzeige entfällt durchgängig, alle Pools werden einheitlich mit Tier und
Wertebereich gezeigt. Entscheidung/Begründung in ADR 0011 (neu); ADR 0008 wird
als abgelöst markiert. poe2db bleibt nur UX-/Abgleich-Vorbild, wird nicht
gescrapt. Bis Schritt 3 zeigt `manifest.json` weiter auf die CoE-Version, damit
die App während der Migration lauffähig bleibt.
- [ ] Schritt 1: Datenfundament. Neues `import-repoe.ts` zieht den
  repoe-poe2-Export (`mods.json`, `mods_by_base.json`, `base_items.json`,
  `tags.json`, `tag_details.json`, `item_classes.json`), normalisiert auf ein
  mod-zentriertes Schema (`origin` je Pool, `slot`, Eignung über
  `spawn_weight > 0` je Tag, kein Gewichtsfeld), Zod-validiert, unter
  `data/<version>/` abgelegt. Essence ist keine eigene Datei: die
  Essence-Modifier stecken in `mods.json` (`generation_type: essence` bzw.
  `is_essence_only`), Corrupted (`generation_type: corrupted`) und Desecrated
  (`domain: desecrated`) ebenso. Gegenprobe an Ringen und Gürteln gegen poe2db
  (Otherworldly muss erscheinen). `manifest.json` noch nicht umschalten.
- [ ] Schritt 2: Query-Engine ohne Wahrscheinlichkeit. `baseEngine` auf reine
  Eignung + Tier (requiredLevel-Rangfolge) + Wertebereich umstellen,
  Chance-Berechnung entfernen; Herkünfte über eine einheitliche Flat-Logik;
  `essenceEngine` auf die Essence-Mods aus `mods.json`. Unit-Tests anpassen.
- [ ] Schritt 3: UI ohne Chance-Spalte. Wahrscheinlichkeits-Anzeige aus dem
  rollbaren Abschnitt entfernen (alle Pools einheitlich), Schätzwert-Hinweis
  raus, Fußzeilen-Attribution auf repoe umstellen. Neue Pools (Otherworldly,
  Genesis Tree) erscheinen automatisch als eigene Abschnitte. Changelog.
- [ ] Schritt 4: Aufräumen + Doku. CoE-Reste entfernen (`import-coe.ts`,
  `schema.coe.ts`, `data/_source/coe`, CoE-Bezüge), ADR 0011 schreiben, ADR 0008
  als abgelöst markieren, `Architektur.md` auf repoe nachziehen.

### Phase 5 – optional/später
- [ ] PWA-Hülle (`vite-plugin-pwa`), Offline-Feinschliff
- [ ] Feinschliff Design/Designsystem
- [ ] `docs/Referenz.md` (Kategorie-Liste, Notizen je poe2db-Ansicht)

---

## Abgeschlossene Vorhaben

Überblick; die Schritt-Details stehen in den Commits und den ADRs.

- **Phase 0 – Setup.** Vite + React 19 + TypeScript (strict), Tailwind v4,
  shadcn/ui, TanStack Router (file-based) + Query, Base `/poe2-mods/` mit
  SPA-Fallback, GitHub-Actions-Deploy, `changelog.json`, Doku-Gerüst. ADR 0001,
  0002.
- **Phase 1 – Datenpipeline und Schema.** Import → normalisiertes Schema,
  Zod als Quelle der Wahrheit, versionierte Daten unter `data/<version>/` mit
  Manifest, Loader-Hooks über TanStack Query, Validierung beim Laden. ADR 0003
  (durch ADR 0008 abgelöst).
- **Phase 2 – Query-Engine.** Reines, DOM-freies Modul: Filter nach Item-Tags,
  Slot, Itemstufe; Dedup nach Gruppe; Tier-Rangfolge; Gewichte →
  Wahrscheinlichkeiten. Unit-Tests. ADR 0004 (durch ADR 0008 abgelöst).
- **Phase 3 – UI-Grundgerüst.** Design-System (Tokens, Schriften, Shell),
  Screen 1 (gruppierte Item-Typ-Auswahl), Screen 2 (Modifier-Browser),
  datengetriebene Basis-Varianten. ADR 0005, 0006. Unique-Ansicht
  zurückgestellt (ADR 0007).
- **Phase 4 – Facet-Search.** Tag-Pills (ODER), Itemstufen-Slider mit
  Live-Neuberechnung, Textsuche, Filter-/Varianten-/View-Zustand als URL-State.
- **Phase 6 – Datenquelle Craft of Exile.** Umstieg von repoe (nur Gewicht 0/1)
  auf den CoE-Snapshot mit rekonstruierten, geschätzten Gewichten; Schätzwert in
  der Oberfläche gekennzeichnet, Attribution in der Fußzeile. ADR 0008. Wird mit
  Phase 8 wieder abgelöst.
- **Phase 7 – Herkünfte.** Rollbar, Corrupted, Desecrated und Essence
  gleichzeitig im Browser (durchgehend Tabelle, gemeinsamer Filter);
  Anzeige-Einheit auf den einzelnen Modifier statt Ausschluss-Gruppe. ADR 0009,
  0010.

---

## Log

- 2026-07-03, 0.12.5 – Anzeige-Einheit auf den einzelnen Modifier umgestellt
  statt auf die interne Ausschluss-Gruppe. `runBaseQuery`/`runFlatQuery`
  gruppieren nach Mod-ID (auch `runEssenceQuery` konsistent); das `group`-Feld
  von `ModGroup`/`DisplayGroup` traegt jetzt die Mod-ID als eindeutigen
  Anzeige-/React-Key. Behebt vermischte Tier bei Modifiern, die sich nur eine
  Ausschluss-Gruppe teilen (Wand: Fire/Cold/Lightning/Chaos/Physical Spell
  Skills, elementare Waffen-Schaden-Praefixe). Chance jetzt je Modifier statt
  Gruppen-Summe; Wand 11 Praefixe / 18 Suffixe (vorher 7 / 13). ADR 0010 neu.
  Typecheck, 62 Tests, Build gruen; an der Wand realdaten-gegengeprueft.
- 2026-07-03, 0.12.4 – Phase 5: Aufgeklappte Tier-Zeilen zeigen nur noch die
  Wertespanne statt den ganzen Mod-Satz (neuer `tierValueText` in modText.ts,
  mehrere Werte per ` / `, Fallback auf Text ohne Zahlen; +4 Tests). ModTable
  nutzt ihn mit `tabular-nums`. Gruppenkopf trägt weiterhin den vollen Text;
  EssenceColumn unverändert (keine Kopfzeile, keine Doppelung). Typecheck, 61
  Tests, Build grün.
- 2026-07-03, 0.12.3 – Phase 5: Filter-Tags auf poe2db-Granularität erweitert.
  `COLOR_TAG_ORDER` (modTags.ts) von 10 auf 26 primäre Tags plus die drei
  Desecrated-Herkünfte (ulaman/amanamu/kurgal_mod) erweitert; interne Unter-Tags
  bleiben aussen vor, da jeder Unter-Tag im Snapshot auch seinen Ober-Tag trägt
  (Filter fängt sie so ohnehin) – Engine/filter.ts unverändert. `tagColors`:
  nur Schadensarten farbig, Rest neutraler Aktiv-Stil. Tag-Tests angepasst.
  Typecheck, 57 Tests, Build grün.
- 2026-07-03, 0.12.2 – Phase 5 (Design-Feinschliff): Textgrößen vereinheitlicht
  (Familienkopf in ModTable 12.5→14px, weiß statt heading), alle Modifier-Texte
  weiß. Theme insgesamt heller und kontrastärmer: `--background`, Surface-,
  Border- und shadcn-Basis-Tokens angehoben, graue Text-Token (secondary/muted/
  dim) heller. Globaler „Alle ein-/ausklappen"-Button samt Logik
  (toggleAll/allCollapsed/CollapseIcon) entfernt; Einzel-Toggle bleibt.
  Typecheck, 57 Tests, Build grün.
- 2026-07-03, 0.12.1 – Phase 5 (Design-Feinschliff): Typ-Tags aus den Tabellen
  entfernt (Filter-Pills oben unverändert, `displayTags` bleibt für die
  Filterung), Modifier-Text 13→14px. Übergeordnete Herkunfts-Überschriften
  (Rollbar/Desecrated/Essence) raus, Herkunft steht im Tabellennamen (z. B.
  „Desecrated Präfixe"); Spaltentitel ruhiger (kein Display-Font, kleiner).
  Itemstufen-Regler auf schmalen, linksbündigen Block begrenzt. Typecheck, 57
  Tests, Build grün.
- 2026-07-03, 0.12.0 – Phase 7, Schritt 3: Essence-Abschnitt (Phase 7 komplett).
  Import zieht mgroup 13 und schreibt `essences.json` je Basis (Stufen je Mod zu
  einem Bereich verdichtet, kleinste Itemstufe); Essence-exklusive Mods mit
  `origin: essence` in `mods.json`. Neue reine `runEssenceQuery` (je Mod eine
  Zeile, keine Chance) + 5 Tests; flache `EssenceColumn`, violetter Akzent
  (`--color-essence`), Loader `useEssences`, Browser-Abschnitt zwischen Desecrated
  und Corrupted. Snapshot 0.5.4: 59 Basen mit Essence, 1086 Zeilen; keine
  Korruption-Essences. ADR 0009 (Nachtrag). Typecheck, 57 Tests, Build grün.
- 2026-07-03 – PLAN aufgeräumt: „Aktueller Stand" auf den Ist-Zustand plus
  Phase-8-Richtung eingedampft, abgeschlossene Phasen 0–7 zu einem Überblick
  verdichtet (Detail in Commits/ADRs), Log-Einträge 0.9.2–0.11.0 ins Archiv
  verschoben.

Ältere Einträge (0.1.0–0.11.0) im Archiv: `docs/archive/PLAN-Log-Archiv.md`.
