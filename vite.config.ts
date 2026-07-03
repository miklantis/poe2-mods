/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { copyFileSync, existsSync } from 'node:fs'
import path from 'node:path'

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
      if (existsSync(index)) {
        copyFileSync(index, fallback)
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: '/poe2-mods/',
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
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
