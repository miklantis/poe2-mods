import { useManifest } from '@/hooks/useManifest'
import { useChangelog } from '@/hooks/useChangelog'

/**
 * Schlanke globale Fusszeile. Nennt die Herkunft der Daten (repoe-Export aus den
 * Spieldateien; Essence aus Craft of Exile aufbereitet), den aktuellen
 * Datenstand (Export-Version und Liga) aus dem Manifest sowie die App-Version
 * aus dem Changelog.
 */
export function AppFooter() {
  const { data: manifest } = useManifest()
  const { data: changelog } = useChangelog()

  return (
    <footer className="mt-auto border-t border-border-subtle">
      <div className="mx-auto w-full max-w-[1240px] px-6 py-5 text-[12px] leading-relaxed text-dim">
        <p>
          Modifier aus den Spieldaten. Quelle:{' '}
          <a
            href="https://github.com/repoe-fork/poe2"
            target="_blank"
            rel="noopener noreferrer"
            className="text-secondary-text underline decoration-dotted underline-offset-2 transition-colors hover:text-body"
          >
            repoe
          </a>
          ; die Essence-Daten sind aus Craft of Exile aufbereitet. Path of Exile
          2 und die Mod-Texte gehören Grinding Gear Games.
        </p>
        {manifest && (
          <p className="mt-1">
            Datenstand: repoe-Export {manifest.current}
            {manifest.leagueLabel ? ` · ${manifest.leagueLabel}` : ''}
            {changelog ? ` · App ${changelog.current}` : ''}
          </p>
        )}
      </div>
    </footer>
  )
}
