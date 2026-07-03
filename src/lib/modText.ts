/**
 * Aufbereitung der originalen Mod-Texte (englischer Spieltext) fuer die Anzeige.
 * DOM-frei und testbar.
 *
 * Die Rohtexte enthalten poe2db-/Wiki-Link-Markup der Form `[Anzeige|Ziel]`
 * oder `[Text]`. Fuer die Anzeige interessiert nur der sichtbare Teil.
 * Rollen-Bereiche stehen als `(min-max)` bereits im Text.
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
 * Familien-Label: der aufbereitete Text mit durch `#` ersetzten Rollen-Werten,
 * z. B. `+(5-8) to Strength` -> `+# to Strength`. Dient als Ueberschrift ueber
 * die Tiers einer Mod-Gruppe.
 */
export function modFamilyLabel(raw: string): string {
  return cleanModText(raw).replace(RANGE, '#').replace(SINGLE, '#')
}
