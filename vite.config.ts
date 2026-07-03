/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
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
        cpSync(dataDir, path.resolve(__dirname, 'dist/data'), { recursive: true })
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
