/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { copyFileSync, existsSync, cpSync, readFileSync } from 'node:fs'
import path from 'node:path'

const BASE = '/poe2-mods/'

// GitHub Pages liefert bei unbekannten Pfaden 404.html aus. Fuer den
// SPA-Fallback (TanStack Router, History-Mode) kopieren wir die index.html
// nach 404.html, damit Deep-Links die App laden statt eine Fehlerseite.
function spaFallback(): Plugin {
  return {
    name: 'spa-fallback-404',
    apply: 'build',
    closeBundle() {
      const index = path.resolve(__dirname, 'dist/index.html')
      const fallback = path.resolve(__dirname, 'dist/404.html')
      if (existsSync(index)) copyFileSync(index, fallback)
    },
  }
}

// Die versionierten Spieldaten liegen unter data/ im Repo-Root (nicht in
// public/, damit die Betriebs-Ablage klar getrennt bleibt). Dieses Plugin
// bedient data/ im Dev-Server und kopiert es beim Build nach dist/data/.
function dataAssets(): Plugin {
  const dataDir = path.resolve(__dirname, 'data')
  const stripBase = (url: string): string => {
    const p = url.split('?')[0]
    if (p.startsWith(BASE)) return p.slice(BASE.length)
    if (p.startsWith('/')) return p.slice(1)
    return p
  }
  return {
    name: 'data-assets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const rel = stripBase(req.url ?? '')
        if (!rel.startsWith('data/')) return next()
        const file = path.resolve(__dirname, rel)
        if (!file.startsWith(dataDir) || !existsSync(file)) return next()
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(readFileSync(file))
      })
    },
    closeBundle() {
      if (existsSync(dataDir)) {
        // _source enthaelt nur die versionierten Roh-Snapshots (Eingabe fuer
        // die Import-Skripte) und gehoert nicht ins Deploy.
        const sourceDir = path.join(dataDir, '_source')
        cpSync(dataDir, path.resolve(__dirname, 'dist/data'), {
          recursive: true,
          filter: (src) => src !== sourceDir && !src.startsWith(sourceDir + path.sep),
        })
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: BASE,
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    // PWA: installierbar + offline. Service Worker (Workbox) laedt still im
    // Hintergrund neue Versionen (autoUpdate). Die App-Huelle wird vorgeladen;
    // die versionierten Spieldaten werden bewusst NICHT vorgeladen, sondern
    // beim Benutzen gecacht (siehe runtimeCaching) – schlanker Install, und
    // ein einmal geoeffneter Item-Typ ist danach offline verfuegbar.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'icons.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'poe2-mods – Modifier-Browser',
        short_name: 'poe2-mods',
        description:
          'Durchsuchbarer Modifier-Browser fuer Path of Exile 2: Modifier, Tier und Wertebereiche je Item-Typ.',
        lang: 'de',
        theme_color: '#14171d',
        background_color: '#14171d',
        display: 'standalone',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // App-Huelle vorladen (JS/CSS/HTML/Fonts/Icons); JSON absichtlich nicht.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // SPA-Deep-Links offline: Navigationen auf die index.html zurueckfallen
        // lassen; Daten-Requests davon ausnehmen.
        navigateFallback: `${BASE}index.html`,
        navigateFallbackDenylist: [/\/data\//],
        runtimeCaching: [
          {
            // Zeigt auf die aktive Version: frisch aus dem Netz, offline der
            // letzte bekannte Stand.
            urlPattern: ({ url }) => url.pathname.endsWith('/data/manifest.json'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'poe2-manifest',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 4, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            // Versionierte Spieldaten sind unveraenderlich: einmal geladen,
            // dauerhaft offline gueltig (neuer Patch = neuer Ordner).
            urlPattern: ({ url }) => /\/data\/[^/]+\/[^/]+\.json$/.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'poe2-data',
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 180 },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.endsWith('/changelog.json'),
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'poe2-changelog' },
          },
        ],
      },
    }),
    dataAssets(),
    spaFallback(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
