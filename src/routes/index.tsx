import { createFileRoute } from '@tanstack/react-router'
import { useManifest } from '@/hooks/useManifest'
import { useMods, useBaseItems, useItemTypes, useTags } from '@/hooks/useGameData'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const manifest = useManifest()
  const mods = useMods()
  const baseItems = useBaseItems()
  const itemTypes = useItemTypes()
  const tags = useTags()

  const loading =
    manifest.isPending ||
    mods.isPending ||
    baseItems.isPending ||
    itemTypes.isPending ||
    tags.isPending

  const error =
    manifest.error ?? mods.error ?? baseItems.error ?? itemTypes.error ?? tags.error

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">poe2-mods</h1>
        <p className="text-muted-foreground max-w-prose">
          Durchsuchbarer Modifier-Browser für Path of Exile 2. Die Datenpipeline
          steht; die Ansichten je Item-Typ folgen als Nächstes.
        </p>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Datenstatus
        </h2>
        {error ? (
          <p className="text-sm text-destructive">
            Daten konnten nicht geladen oder nicht validiert werden: {error.message}
          </p>
        ) : loading ? (
          <p className="text-sm text-muted-foreground">Lade und validiere Daten …</p>
        ) : (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
            <Stat label="Version" value={manifest.data?.current ?? '–'} />
            <Stat label="Item-Typen" value={itemTypes.data?.length ?? 0} />
            <Stat label="Modifier" value={mods.data?.length ?? 0} />
            <Stat label="Basis-Items" value={baseItems.data?.length ?? 0} />
            <Stat label="Tags" value={tags.data?.length ?? 0} />
          </dl>
        )}
      </div>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  )
}
