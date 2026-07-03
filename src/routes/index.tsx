import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-semibold tracking-tight">poe2-mods</h1>
      <p className="text-muted-foreground max-w-prose">
        Durchsuchbarer Modifier-Browser für Path of Exile 2. Das Grundgerüst
        steht, Daten und Ansichten folgen in den nächsten Schritten.
      </p>
    </section>
  )
}
