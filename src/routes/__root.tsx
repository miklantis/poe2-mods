import { useEffect } from 'react'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { AppFooter } from '@/components/AppFooter'
import { useChangelog } from '@/hooks/useChangelog'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  const { data: changelog } = useChangelog()

  // Fenster-/Tab-Titel um die aktuelle App-Version ergaenzen, sobald der
  // Changelog geladen ist. Bewusst nur die Version ("v0.17.4"): die als
  // Chrome-PWA installierte App stellt den Manifest-Namen
  // ("poe2-mods – Modifier-Browser") voran, sodass der Fenstertitel sauber als
  // "poe2-mods – Modifier-Browser - v0.17.4" liest, ohne den Namen doppelt.
  // Vor dem Laden bleibt der statische Titel aus index.html.
  useEffect(() => {
    if (!changelog) return
    document.title = `v${changelog.current}`
  }, [changelog])

  return (
    <div className="flex min-h-svh flex-col">
      <main className="flex-1">
        <Outlet />
      </main>
      <AppFooter />
    </div>
  )
}
