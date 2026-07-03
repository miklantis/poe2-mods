import { useQuery } from '@tanstack/react-query'
import { loadJson } from '@/data/client'
import { changelogSchema } from '@/data/schema.repoe'

/** Laedt public/changelog.json (App-Version fuer die Fusszeile). */
export function useChangelog() {
  return useQuery({
    queryKey: ['changelog'],
    queryFn: () => loadJson('changelog.json', changelogSchema),
  })
}
