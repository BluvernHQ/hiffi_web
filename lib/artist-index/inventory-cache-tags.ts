/** Next.js fetch cache tag for all GET /inventory responses used by artist-index. */
export const ARTIST_INVENTORY_CACHE_TAG = "artist-inventory"

export function artistInventoryUsernameTag(username: string): string {
  return `artist-inventory:${username.trim().toLowerCase()}`
}
