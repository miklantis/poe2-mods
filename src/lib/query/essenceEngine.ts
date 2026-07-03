import type { EssenceMod, Mod, Slot } from '@/data/schema.coe'
import { modFamilyLabel } from '@/lib/modText'
import type { ComputedMod, DisplayGroup } from './baseEngine'

/**
 * Reine, DOM-freie Query fuer den Essence-Abschnitt. Essences setzen einen Mod
 * gezielt: kein Spawn-Gewicht, keine Chance. Die Stufen (Lesser/Essence/Greater/
 * …) sind im Import bereits je Mod zu einer Zeile verdichtet – daher hier eine
 * Zeile je Mod mit dem Bereich ueber alle Stufen (`values`) und der kleinsten
 * per Essence erreichbaren Itemstufe (`ilvl`).
 *
 * Die Ausgabe nutzt denselben `DisplayGroup`, den auch die anderen Herkuenfte
 * liefern (je Gruppe genau ein `ComputedMod`), damit der Suchfilter
 * (`filterGroups`) und die Tag-Sammlung (`availableTags`) unveraendert greifen.
 * Slot, Text, Gruppe und Tags kommen ueber die Mod-ID aus `modsById`.
 */

export interface EssenceQueryContext {
  /** Eingestellte Itemstufe. Zeilen mit hoeherem Mindest-ilvl fallen heraus. */
  itemLevel: number
}

export interface EssenceQueryResult {
  prefixes: DisplayGroup[]
  suffixes: DisplayGroup[]
}

/**
 * Loest je Essence-Zeile den Mod auf, filtert auf die erreichbare Itemstufe und
 * trennt nach Slot. Zeilen mit unbekannter Mod-ID oder ohne Slot werden
 * uebersprungen (Datenintegritaet ist Sache des Imports/Loaders). Gruppen werden
 * je Slot nach ihrem Familien-Label alphabetisch sortiert.
 */
export function runEssenceQuery(
  rows: readonly EssenceMod[],
  modsById: ReadonlyMap<string, Mod>,
  ctx: EssenceQueryContext,
): EssenceQueryResult {
  const prefixes: { group: DisplayGroup; slot: Slot }[] = []
  const suffixes: { group: DisplayGroup; slot: Slot }[] = []

  for (const row of rows) {
    const mod = modsById.get(row.mod)
    if (!mod || mod.slot == null) continue
    if (row.ilvl > ctx.itemLevel) continue
    const computed: ComputedMod = {
      mod,
      tier: 1,
      tierCount: 1,
      ilvl: row.ilvl,
      weight: 0,
      values: row.values,
      probability: 0,
    }
    const group: DisplayGroup = {
      group: mod.group,
      probability: 0,
      mods: [computed],
    }
    if (mod.slot === 'prefix') prefixes.push({ group, slot: 'prefix' })
    else suffixes.push({ group, slot: 'suffix' })
  }

  const byFamily = (
    a: { group: DisplayGroup },
    b: { group: DisplayGroup },
  ): number => {
    const fa = modFamilyLabel(a.group.mods[0]?.mod.text ?? a.group.group)
    const fb = modFamilyLabel(b.group.mods[0]?.mod.text ?? b.group.group)
    return fa.localeCompare(fb)
  }
  prefixes.sort(byFamily)
  suffixes.sort(byFamily)

  return {
    prefixes: prefixes.map((p) => p.group),
    suffixes: suffixes.map((s) => s.group),
  }
}
