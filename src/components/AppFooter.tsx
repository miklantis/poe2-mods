import { useManifest } from '@/hooks/useManifest'

/**
 * Schlanke globale Fusszeile. Nennt die Herkunft der Spawn-Gewichte (Craft of
 * Exile) und macht deren Schaetzwert-Charakter transparent, dazu den aktuellen
 * Datenstand (Spielversion und Liga) aus dem Manifest.
 */
export function AppFooter() {
  const { data: manifest } = useManifest()

  return (
    <footer className="mt-auto border-t border-border-subtle">
      <div className="mx-auto w-full max-w-[1240px] px-6 py-5 text-[12px] leading-relaxed text-dim">
        <p>
          Spawn-Gewichte, Tier und Chance sind Schätzwerte. Quelle:{' '}
          <a
            href="https://www.craftofexile.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-secondary-text underline decoration-dotted underline-offset-2 transition-colors hover:text-body"
          >
            Craft of Exile
          </a>
          . Path of Exile 2 und die Mod-Texte gehören Grinding Gear Games.
        </p>
        {manifest && (
          <p className="mt-1">
            Datenstand: PoE2 {manifest.current}
            {manifest.leagueLabel ? ` · ${manifest.leagueLabel}` : ''}
          </p>
        )}
      </div>
    </footer>
  )
}
