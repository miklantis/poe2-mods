# ADR 0001 – Tech-Stack und Deployment

Status: akzeptiert
Datum: 2026-07-03

## Kontext

poe2-mods ist ein read-only Modifier-Browser ohne Backend. Die Daten sind
statische, versionierte JSON-Dateien. Das Hosting läuft über GitHub Pages.

## Entscheidung

- React 19 + Vite, TypeScript strict.
- TanStack Router (file-based) für Routing, TanStack Query für den Datenzugriff
  auf die statischen JSONs (Fetch, Caching, Staleness).
- Tailwind v4 + shadcn/ui für UI, Lucide für Icons.
- Zod als Quelle der Wahrheit für Datenformen.
- Vitest für Unit-Tests.
- Deploy über GitHub Actions auf GitHub Pages, Vite `base` = `/poe2-mods/`.

## Konsequenzen

- Kein Server, kein State-Backend; Filter-Zustand kommt später in den URL-State.
- Für Deep-Links unter Pages ist ein SPA-Fallback nötig (`index.html` → `404.html`
  beim Build), da der Router im History-Mode läuft.
- Die Pages-Quelle muss im Repo einmalig auf „GitHub Actions" stehen.
