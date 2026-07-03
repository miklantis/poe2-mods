/**
 * Aufbereitung der originalen Mod-Texte (englischer Spieltext) fuer die Anzeige.
 * DOM-frei und testbar.
 *
 * Im basis-zentrierten CoE-Schema ist der Mod-Text eine Vorlage mit `#`-
 * Platzhaltern (z. B. `# to maximum Life`); die konkreten Rollen-Bereiche
 * stehen pro Tier separat in dessen `values`. Fuer die Anzeige einer Tier-Zeile
 * werden die Platzhalter der Reihe nach mit den Tier-Werten gefuellt.
 *
 * Etwaiges poe2db-/Wiki-Link-Markup der Form `[Anzeige|Ziel]` oder `[Text]`
 * wird auf den sichtbaren Teil reduziert.
 */

const LINK_WITH_TARGET = /\[([^\]|]+)\|[^\]]*\]/g
const LINK_PLAIN = /\[([^\]]+)\]/g

/** Entfernt das Link-Markup und liefert reinen, lesbaren Text. */
export function cleanModText(raw: string): string {
  return raw.replace(LINK_WITH_TARGET, '$1').replace(LINK_PLAIN, '$1').trim()
}

const RANGE = /\((\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)\)/g
const SINGLE = /\((\d+(?:\.\d+)?)\)/g

/**
 * Familien-Label: der aufbereitete Vorlagentext mit `#`-Platzhaltern, wie er
 * als Ueberschrift ueber die Tiers einer Mod-Gruppe dient. Etwaige bereits im
 * Text stehende Rollen-Bereiche `(min-max)` werden ebenfalls zu `#`
 * vereinheitlicht, damit das Label unabhaengig von der Textquelle stabil ist.
 */
export function modFamilyLabel(raw: string): string {
  return cleanModText(raw).replace(RANGE, '#').replace(SINGLE, '#')
}

/** Formatiert eine Zahl ohne ueberfluessige Nachkommastellen (2.10 -> 2.1). */
function formatNum(n: number): string {
  return Number(n.toFixed(2)).toString()
}

/**
 * Formatiert einen Rollen-Bereich: `(min-max)`, bei gleichem Min und Max nur
 * die einzelne Zahl (ohne Klammer).
 */
export function formatRoll(min: number, max: number): string {
  return min === max ? formatNum(min) : `(${formatNum(min)}-${formatNum(max)})`
}

/**
 * Fuellt die `#`-Platzhalter der Vorlage der Reihe nach mit den Rollen-Bereichen
 * eines Tiers. Fehlt zu einem Platzhalter ein Wert, bleibt `#` stehen.
 */
export function fillModText(
  template: string,
  values: readonly (readonly [number, number])[],
): string {
  let i = 0
  return cleanModText(template).replace(/#/g, () => {
    const v = values[i++]
    return v ? formatRoll(v[0], v[1]) : '#'
  })
}

/**
 * Kompakte Tier-Darstellung: nur die Rollen-Bereiche eines Tiers, nicht der
 * ganze Mod-Satz. Ueber der Gruppe steht bereits der volle Vorlagentext mit
 * `#`, daher genuegt in der Tier-Zeile die Zahl bzw. Zahlenspanne. Mehrere
 * Platzhalter (z. B. `Adds # to # Fire Damage`) werden mit ` / ` getrennt.
 * Hat ein Mod keine Rollen-Werte (reiner Text ohne Zahl), wird ausnahmsweise
 * der lesbare Text gezeigt, damit die Zeile nicht leer bleibt.
 */
export function tierValueText(
  template: string,
  values: readonly (readonly [number, number])[],
): string {
  if (values.length === 0) return cleanModText(template)
  return values.map((v) => formatRoll(v[0], v[1])).join(' / ')
}
