/**
 * Wandelt einen Item-Typ-Namen in einen URL-tauglichen Slug um.
 * Beispiel: "Body Armours" -> "body-armours". Da die Item-Typ-Namen in den
 * Daten eindeutig sind, sind auch die Slugs eindeutig.
 */
export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
