/**
 * URL-safe slug generation.
 *
 * Lowercases, strips diacritics, replaces any run of non-alphanumeric
 * characters with a single hyphen, and trims leading/trailing hyphens.
 * `slugify("Kaos Polos — Hitam!")` → "kaos-polos-hitam".
 */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // drop combining diacritical marks
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/** Slug pattern accepted by the DB and validation layer. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function isValidSlug(value: string): boolean {
  return SLUG_PATTERN.test(value)
}
