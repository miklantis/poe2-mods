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
    <section className="mx-auto w-full max-w-5xl px-6 py-14 space-y-8">
      <div className="space-y-3">
        <h1 className="font-display text-3xl font-bold tracking-tight text-heading">
          poe2-mods
        </h1>
        <p className="max-w-prose text-secondary-text">
          Durchsuchbarer Modifier-Browser für Path of Exile 2. Die Datenpipeline
          steht; die Ansichten je Item-Typ folgen als Nächstes.
        </p>
      </div>

      <div className="rounded-lg border border-border-card bg-surface p-5">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.12em] text-muted-text">
          Datenstatus
        </h2>
        {error ? (
          <p className="text-sm text-destructive">
            Daten konnten nicht geladen oder nicht validiert werden: {error.message}
          </p>
        ) : loading ? (
          <p className="text-sm text-secondary-text">Lade und validiere Daten …</p>
        ) : (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
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
    <div className="flex flex-col gap-0.5">
      <dt className="text-secondary-text">{label}</dt>
      <dd className="font-mono text-base font-medium tabular-nums text-body">
        {value}
      </dd>
    </div>
  )
}
