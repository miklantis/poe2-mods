# ADR 0013 – Weitere Basis-Welten (Jewels, Flasks/Charms, Waystones, Tablets, Relics)

Status: akzeptiert (2026-07-03)
Datum: 2026-07-03

## Kontext

Der Import (ADR 0011) wertete als rollbar nur Modifier der repoe-Domain `item`
aus. Damit fehlten ganze Kategorien, die die poe2db-Übersicht führt und die zum
Nachschlagen dazugehören: Jewels (Ruby/Emerald/Sapphire/Diamond samt Time-Lost),
Flasks (Life/Mana) und Charms, Waystones, Tablets sowie Relics. Ihre Modifier
liegen im Export in eigenen Domains: Jewels in `misc`, Flasks/Charms in `flask`,
Waystones in `area`, Tablets in `tablet`, Relics in `sanctum_relic`. Da deren
Basen keinen der aus `item` abgeleiteten craftbaren Tags tragen, fielen die
Klassen bei der Item-Typ-Bildung komplett heraus.

ADR 0011 hatte den Umfang implizit als Ausrüstungs-Browser gefasst
(„Nicht-Item-Domains draußen"). Das wird hier bewusst erweitert: Der Browser ist
ein Nachschlage-Browser für alle rollbaren Basis-Welten, nicht nur Ausrüstung.

## Problem: der Tag `default`

Die neuen Domains nutzen den allgegenwärtigen Tag `default` (für domänenweite
Mods) – und praktisch jede Basis trägt ihn ebenfalls. Über die Eignung „teilt
mindestens einen Tag" würde `default` alles mit allem verbinden: Flask-Mods
erschienen auf Waffen, Item-Mods auf Waystones. Ein naives Aufnehmen der Domains
hätte zudem über `default` Dutzende Nicht-Ausrüstungs-Klassen (Gems, Currency,
Quest-Items) als Item-Typen eingezogen.

## Entscheidung

- `originOf` akzeptiert rollbar (prefix/suffix) und corrupted zusätzlich aus den
  Domains `flask`, `misc`, `area`, `tablet`, `sanctum_relic`. Essence bleibt auf
  `item` beschränkt (repoe führt Essence ohnehin nicht als Ausrüstungs-Pool; CoE
  deckt Essence separat ab, ADR 0011).
- Der Tag `default` wird als Eignungs- und als craftbares Signal ignoriert.
  Jede Domain bildet eine eigene Basis-Welt; domänenweite Mods (nur `default`)
  erhalten stattdessen einen unsichtbaren Marker `__dom_<domain>`, der auch an
  die Basen derselben Welt gehängt wird (Desecrated rollt auf der Item-Welt).
  Spezifische Tags (z. B. `life_flask`, `intjewel`, `map_key_high`,
  `tower_augment_breach`, `small_sanctum_relic`) bleiben unverändert und tragen
  die Feinauswahl innerhalb einer Welt.
- Item-Typ-Bildung zusätzlich auf Basen der akzeptierten Domains begrenzt, damit
  kein Fremd-Material (undefined-Domains u. Ä.) hereinkommt.
- Der Marker ist nur intern: die Filter-Pills nutzen die beschreibenden
  `filterTags`, nicht die Eignungs-Tags; er erscheint nirgends in der
  Oberfläche.

## Konsequenzen

- 30 → 37 Item-Typen; neu: Jewel (8 Varianten inkl. Time-Lost), Life/Mana Flask,
  Charms (UtilityFlask), Waystones (Map, Tier 1–16), Tablet (TowerAugmentation),
  Relics (Relic, sieben Basen). Startseite: Charms unter „Flasks", neue Gruppe
  „Relics"; Reihenfolge an poe2db angelehnt.
- Waystones bleiben ein Typ mit Basis-Varianten (Tier als Basis), keine
  künstliche Low/Mid/Top-Dreiteilung – Struktur kommt aus den Daten.
- Keine Schema-Änderung: Marker sind gewöhnliche Tag-Strings; Zod unverändert.
- Cross-Welt-Isolation per Prüfung bestätigt (kein Marker-Leak zwischen Welten).
