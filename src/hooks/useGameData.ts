import { useQuery } from '@tanstack/react-query'
import { loadJson } from '@/data/client'
import { useManifest } from '@/hooks/useManifest'
import {
  modsFileSchema,
  itemTypesFileSchema,
  baseItemsFileSchema,
  essencesFileSchema,
} from '@/data/schema.repoe'

/**
 * Version-spezifische Loader. Sie warten auf das Manifest und laden dann die
 * Dateien der aktuell gueltigen Version. Komponenten kennen die JSON-Struktur
 * nicht direkt, sondern gehen ueber diese Hooks.
 *
 * Datenform (mod-zentriertes repoe-Schema, `src/data/schema.repoe.ts`):
 *  - mods.json       Modifier-Familien mit Tiers (id, ilvl, Werte), Herkunft,
 *                    Slot und Eignungs-Tags,
 *  - item_types.json Item-Typen mit ihren Basis-Varianten,
 *  - base_items.json Basen mit Tags (fuer die Eignung) und Item-Klasse,
 *  - essences.json   je Item-Klasse die per Essence garantierten Mods (aus den
 *                    CoE-Daten aufbereitet).
 */
export function useMods() {
  const { data: manifest } = useManifest()
  const version = manifest?.current
  return useQuery({
    queryKey: ['mods', version],
    queryFn: () => loadJson(`data/${version}/mods.json`, modsFileSchema),
    enabled: Boolean(version),
  })
}

export function useItemTypes() {
  const { data: manifest } = useManifest()
  const version = manifest?.current
  return useQuery({
    queryKey: ['item_types', version],
    queryFn: () => loadJson(`data/${version}/item_types.json`, itemTypesFileSchema),
    enabled: Boolean(version),
  })
}

export function useBaseItems() {
  const { data: manifest } = useManifest()
  const version = manifest?.current
  return useQuery({
    queryKey: ['base_items', version],
    queryFn: () => loadJson(`data/${version}/base_items.json`, baseItemsFileSchema),
    enabled: Boolean(version),
  })
}

export function useEssences() {
  const { data: manifest } = useManifest()
  const version = manifest?.current
  return useQuery({
    queryKey: ['essences', version],
    queryFn: () => loadJson(`data/${version}/essences.json`, essencesFileSchema),
    enabled: Boolean(version),
  })
}
