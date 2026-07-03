import type { ZodType } from 'zod'

/**
 * Laedt eine JSON-Datei relativ zum App-Basispfad und validiert sie gegen ein
 * Zod-Schema. Ein kaputter oder umbenannter Export faellt hier laut auf,
 * statt still falsche Werte anzuzeigen.
 */
export async function loadJson<T>(pathRel: string, schema: ZodType<T>): Promise<T> {
  const res = await fetch(`${import.meta.env.BASE_URL}${pathRel}`)
  if (!res.ok) {
    throw new Error(`Laden fehlgeschlagen (${res.status}): ${pathRel}`)
  }
  const json: unknown = await res.json()
  return schema.parse(json)
}
