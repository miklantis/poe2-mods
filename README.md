# poe2-mods

Statischer, durchsuchbarer Modifier-Browser für Path of Exile 2. Read-only:
zeigt je Item-Typ die möglichen Modifier mit Tier, Rollen-Bereich und
Spawn-Gewicht, gespeist aus versionierten JSON-Daten (Community-Exports der
Spieldaten).

Live: https://miklantis.github.io/poe2-mods/

## Entwicklung

    npm install
    npm run dev        # lokaler Dev-Server
    npm run typecheck  # tsc (strict)
    npm run test       # Vitest
    npm run build      # Produktions-Build nach dist/

## Aufbau

- React 19 + Vite, TypeScript strict
- TanStack Router (file-based, `src/routes`) + TanStack Query
- Tailwind v4 + shadcn/ui (`src/components/ui`), Lucide-Icons
- Zod als Quelle der Wahrheit für Datenformen

Details in `docs/Architektur.md`, Entscheidungen in `docs/adr/`, Fortschritt
in `PLAN.md`.

## Deployment

Automatisch über GitHub Actions auf GitHub Pages bei Push auf `main`.
Vite `base` ist `/poe2-mods/`.
