# ADR 0012 – PWA: installierbar und offline über Runtime-Caching

Status: akzeptiert (2026-07-03)
Datum: 2026-07-03

## Kontext

Die App ist ein statischer, read-only Modifier-Browser ohne Backend: eine
App-Hülle (JS/CSS/HTML/Fonts) plus versionierte JSON-Spieldaten unter
`data/<version>/`, auf die `data/manifest.json` zeigt. Die Daten sind mit rund
1 MB deploybar der mit Abstand größte Brocken. Ziel war Installierbarkeit
(Homescreen/Desktop) und Offline-Nutzung, ohne den Umfang zu sprengen.

## Entscheidung

`vite-plugin-pwa` (Workbox, `generateSW`) erzeugt Service Worker und
Web-App-Manifest.

Update-Verhalten: `autoUpdate` – neue Versionen werden still im Hintergrund
geladen und beim nächsten Öffnen aktiv, ohne Update-Hinweis in der Oberfläche.

Caching-Strategie, die die Versionierung der Daten ausnutzt:

- App-Hülle wird vorgeladen (precache): sofort offline.
- Die versionierten Spieldaten werden bewusst **nicht** vorgeladen, sondern
  beim Benutzen gecacht:
  - `data/manifest.json`: NetworkFirst (Timeout 5 s) – online der aktuelle
    Stand, offline der letzte bekannte.
  - `data/<version>/*.json`: CacheFirst – versionierte Pfade sind
    unveränderlich, ein einmal geladener Item-Typ bleibt dauerhaft offline
    gültig. Ein neuer Patch erzeugt einen neuen Ordner und damit einen neuen
    Cache-Eintrag, ohne Kollision mit altem Stand.
  - `changelog.json`: StaleWhileRevalidate.
- SPA-Deep-Links offline über `navigateFallback` auf die `index.html`;
  `data/`-Requests sind per Denylist ausgenommen.

Icons werden aus `public/favicon.svg` abgeleitet (192/512, eine
maskable-Variante, apple-touch-icon). Theme-/Hintergrundfarbe `#14171d` aus dem
dunklen Theme.

## Begründung

CacheFirst auf unveränderlichen, versionierten Pfaden ist die saubere
Entsprechung des Datenmodells: kein Stale-Risiko, weil sich ein Pfad nie ändert;
neue Daten kommen ausschließlich über einen neuen Versionsordner, den das
Manifest freigibt. Runtime-Caching statt Voll-Vorladen hält den Install schlank
(rund 0,9 MB App-Hülle statt zusätzlich ~1 MB Daten) und koppelt SW-Updates
nicht an jeden Datenpatch.

## Konsequenzen

- Offline-Vollständigkeit gilt pro Item-Typ erst nach dem ersten Online-Aufruf.
  Das ist der bewusste Preis gegen einen schlanken Install; ein Voll-Vorladen
  wäre die Alternative, falls „ab erstem Start komplett offline" später
  gewünscht ist.
- `sharp` diente nur einmalig zum Rastern der Icons und liegt nicht im Repo;
  eine erneute Icon-Erzeugung braucht es kurzfristig wieder.
- Optionaler, noch offener Feinschliff: ein sichtbarer Offline-Indikator in der
  Oberfläche.
