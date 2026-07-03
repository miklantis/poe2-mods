import { useQuery } from '@tanstack/react-query'
import { loadJson } from '@/data/client'
import { useManifest } from '@/hooks/useManifest'
import {
  modsFileSchema,
  baseItemsFileSchema,
  itemTypesFileSchema,
  tagsFileSchema,
} from '@/data/schema'

/**
 * Version-spezifische Loader. Sie warten auf das Manifest und laden dann die
 * Dateien der aktuell gueltigen Version. Komponenten kennen die JSON-Struktur
 * nicht direkt, sondern gehen ueber diese Hooks.
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

export function useBaseItems() {
  const { data: manifest } = useManifest()
  const version = manifest?.current
  return useQuery({
    queryKey: ['base_items', version],
    queryFn: () => loadJson(`data/${version}/base_items.json`, baseItemsFileSchema),
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

export function useTags() {
  const { data: manifest } = useManifest()
  const version = manifest?.current
  return useQuery({
    queryKey: ['tags', version],
    queryFn: () => loadJson(`data/${version}/tags.json`, tagsFileSchema),
    enabled: Boolean(version),
  })
}
