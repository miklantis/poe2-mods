import { createRootRoute, Outlet } from '@tanstack/react-router'
import { AppFooter } from '@/components/AppFooter'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <main className="flex-1">
        <Outlet />
      </main>
      <AppFooter />
    </div>
  )
}
