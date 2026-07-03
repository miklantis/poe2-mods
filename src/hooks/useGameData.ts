import { useQuery } from '@tanstack/react-query'
import { loadJson } from '@/data/client'
import { useManifest } from '@/hooks/useManifest'
import {
  modsFileSchema,
  itemTypesFileSchema,
  baseModsFileSchema,
  essencesFileSchema,
} from '@/data/schema.coe'

/**
 * Version-spezifische Loader. Sie warten auf das Manifest und laden dann die
 * Dateien der aktuell gueltigen Version. Komponenten kennen die JSON-Struktur
 * nicht direkt, sondern gehen ueber diese Hooks.
 *
 * Datenform (basis-zentriertes CoE-Schema, `src/data/schema.coe.ts`):
 *  - mods.json       schlanke Mod-Metadaten (Text, Slot, Gruppe, Tags),
 *  - item_types.json Item-Typen mit ihren Basis-Varianten,
 *  - base_mods.json  je Basis die rollbaren Mods mit Tiers (ilvl/Gewicht/Werte).
 *  - essences.json   je Basis die per Essence garantierten Mods (Bereich, ilvl).
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

export function useBaseMods() {
  const { data: manifest } = useManifest()
  const version = manifest?.current
  return useQuery({
    queryKey: ['base_mods', version],
    queryFn: () => loadJson(`data/${version}/base_mods.json`, baseModsFileSchema),
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
