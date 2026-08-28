import type { Artist } from "@/lib/artists"
import { mapInventoryProfileToArtist } from "@/lib/artist-index/map-inventory-to-artist"
import { fetchUserProfileInitial } from "@/lib/seo/fetch-public"
import type { PublicInventoryProfile } from "@/lib/types/inventory"

/**
 * Map inventory rows to directory artists with linked user photos (same as profile detail page).
 * One parallel GET /users/{username} per card on the current page.
 */
export async function mapInventoryProfilesToArtists(
  profiles: PublicInventoryProfile[],
): Promise<Artist[]> {
  if (profiles.length === 0) return []

  return Promise.all(
    profiles.map(async (profile) => {
      let linked: Record<string, unknown> | null = null
      try {
        linked = await fetchUserProfileInitial(profile.username)
      } catch {
        linked = null
      }
      return mapInventoryProfileToArtist(profile, linked)
    }),
  )
}
