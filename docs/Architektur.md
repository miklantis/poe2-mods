# Architektur – poe2-mods

Kurzüberblick über Aufbau und Leitplanken. Details zu einzelnen Entscheidungen
liegen in `docs/adr/`.

## Zweck

Statischer, durchsuchbarer Modifier-Browser für Path of Exile 2 (read-only).
Er liest versionierte JSON-Daten aus Community-Exports der Spieldaten und zeigt
je Item-Typ die möglichen Modifier mit Tier, Rollen-Bereich und Spawn-Gewicht.

## Tech-Stack

- React 19 mit Vite als Build-Werkzeug
- TypeScript strict (kein `any`)
- TanStack Router (file-based, `src/routes`)
- TanStack Query für den Datenzugriff (der „Server" sind die statischen JSONs)
- Tailwind CSS v4, shadcn/ui-Primitives in `src/components/ui`
- Lucide-Icons
- Zod als Quelle der Wahrheit für Datenformen; TS-Typen daraus abgeleitet
- Vitest für Unit-Tests

## Leitplanken

- Query-/Filter-Logik bleibt ein DOM-freies, testbares Modul.
- Datenzugriff ist in Hooks gekapselt; Komponenten kennen die JSON-Struktur nicht direkt.
- Wiederverwendbare Primitives in `src/components/ui`.
- Bedienbegriffe deutsch, Code-/Architekturbegriffe englisch, Mod-Texte im Original-Spieltext.

## Datenschema

Wird in Phase 1 festgelegt (normalisiertes Schema aus dem repoe-fork-Export).

## Deployment

GitHub Pages über GitHub Actions. Vite `base` ist `/poe2-mods/`. Für Deep-Links
wird beim Build `index.html` nach `404.html` kopiert (SPA-Fallback).

## Ist-Zustand

Phase 0 (Setup) umgesetzt: Grundgerüst, Routing, Styling, Deploy-Pipeline,
Changelog- und Docs-Struktur. Noch keine Spieldaten und keine fachlichen Ansichten.
