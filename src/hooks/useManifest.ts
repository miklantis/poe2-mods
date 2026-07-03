import { useQuery } from '@tanstack/react-query'
import { loadJson } from '@/data/client'
import { manifestSchema } from '@/data/schema.coe'

/** Laedt data/manifest.json (aktive Version + verfuegbare Versionen). */
export function useManifest() {
  return useQuery({
    queryKey: ['manifest'],
    queryFn: () => loadJson('data/manifest.json', manifestSchema),
  })
}
