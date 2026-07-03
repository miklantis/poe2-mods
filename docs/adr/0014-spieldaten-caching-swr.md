# ADR 0014 – Spieldaten-Caching: StaleWhileRevalidate statt CacheFirst

Status: akzeptiert (2026-07-03)
Datum: 2026-07-03

Ergänzt ADR 0012 (PWA und Offline-Caching).

## Kontext

ADR 0012 cachte die versionierten Spieldaten (`data/<version>/*.json`) per
CacheFirst – unter der Annahme, sie seien pro Version unveränderlich („neuer
Patch = neuer Ordner"). Beim Nachziehen der Daten unter derselben Version
(z. B. 0.15.0: neue Kategorien in `data/4.5.4.3/`, ohne Versionswechsel) greift
diese Annahme nicht: CacheFirst revalidiert nie, also bekamen bereits geöffnete
oder installierte Clients bis zu 180 Tage die alte `item_types.json` – ohne die
neuen Kategorien.

## Entscheidung

Spieldaten laufen künftig über StaleWhileRevalidate: offline sofort aus dem
Cache, online zugleich Hintergrund-Revalidierung. In-Place-Aktualisierungen
unter gleicher Version werden damit beim nächsten Laden übernommen; Offline-
Nutzung bleibt erhalten (Fallback auf den letzten Cache-Stand). Der Cache-Name
wurde auf `poe2-data-v2` erhöht, damit bestehende Installationen den alten,
festhängenden Cache verlassen und einmalig frisch ziehen.

## Betriebsregel

Der eingespielte Update-Ablauf bei neuem Patch bleibt: neuer Export, Import,
`data/<neue-version>/`, `manifest.json` fortschreiben. Wird ausnahmsweise unter
gleicher Version nachgebessert (Import-Korrektur, ergänzte Pools), ist das jetzt
unkritisch – die Daten aktualisieren sich beim nächsten Öffnen von selbst.

## Konsequenzen

- Pro Online-Aufruf eine zusätzliche Hintergrund-Anfrage je genutzter
  Datendatei; Datenmenge ist klein, Offline unberührt.
- Nach einem Update ggf. ein zusätzlicher Reload nötig, bis der neue Service
  Worker aktiv ist und die frischen Daten ausliefert.
