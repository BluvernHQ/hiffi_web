import { revalidatePath, revalidateTag } from "next/cache"
import {
  ARTIST_INVENTORY_CACHE_TAG,
  artistInventoryUsernameTag,
} from "@/lib/artist-index/inventory-cache-tags"

export { ARTIST_INVENTORY_CACHE_TAG, artistInventoryUsernameTag }

/**
 * Drop cached inventory list/profile payloads and artist-index routes so
 * claim_status (unclaimed → pending → claimed) shows up immediately after
 * claim submit or admin approve.
 *
 * Server-only — import from Route Handlers / Server Actions, not client components.
 */
export function revalidateArtistInventory(username?: string | null): void {
  // Immediate expiry — do not serve stale claim_status after approve/submit.
  revalidateTag(ARTIST_INVENTORY_CACHE_TAG, { expire: 0 })

  const slug = username?.trim().toLowerCase()
  if (slug) {
    revalidateTag(artistInventoryUsernameTag(slug), { expire: 0 })
    revalidatePath(`/artist-index/${encodeURIComponent(slug)}`)
    revalidatePath(`/artist-index/${encodeURIComponent(slug)}/claim`)
  }

  revalidatePath("/artist-index")
  revalidatePath("/artist-index/claim")
}
