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
  // Changelog geladen ist. Vor dem Laden bleibt der statische Titel aus
  // index.html stehen.
  useEffect(() => {
    if (!changelog) return
    document.title = `poe2-mods v${changelog.current} – Modifier-Browser`
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
