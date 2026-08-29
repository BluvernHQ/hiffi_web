import type { Artist } from "@/lib/artists"
import type { InventorySort, PublicInventoryProfile } from "@/lib/types/inventory"

function featuredDisplayRank(claimStatus: PublicInventoryProfile["claim_status"]): number {
  switch (claimStatus) {
    case "claimed":
      return 0
    case "pending":
      return 1
    case "unclaimed":
      return 2
    default:
      return 3
  }
}

/** Claimed first; pending and unclaimed share a tier (mixed A→Z). */
function verifiedFirstDisplayRank(claimStatus: PublicInventoryProfile["claim_status"]): number {
  return claimStatus === "claimed" ? 0 : 1
}

function compareNames(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: "base" })
}

/** All public inventory sorts are paginated server-side via GET /inventory `sort`. */
export function inventorySortUsesServerPagination(_sort: InventorySort): boolean {
  return true
}

function displayRank(
  claimStatus: PublicInventoryProfile["claim_status"],
  sort: InventorySort,
): number {
  return sort === "featured"
    ? featuredDisplayRank(claimStatus)
    : verifiedFirstDisplayRank(claimStatus)
}

export function compareInventoryProfiles(
  a: PublicInventoryProfile,
  b: PublicInventoryProfile,
  sort: InventorySort,
): number {
  switch (sort) {
    case "featured":
    case "verified_first": {
      const rankDiff = displayRank(a.claim_status, sort) - displayRank(b.claim_status, sort)
      if (rankDiff !== 0) return rankDiff
      return compareNames(a.artist_name, b.artist_name)
    }
    case "name":
    default:
      return compareNames(a.artist_name, b.artist_name)
  }
}

export function sortInventoryProfiles(
  items: PublicInventoryProfile[],
  sort: InventorySort,
): PublicInventoryProfile[] {
  if (sort === "name") return items
  return [...items].sort((a, b) => compareInventoryProfiles(a, b, sort))
}

export function compareArtistsByDisplaySort(a: Artist, b: Artist, sort: InventorySort): number {
  switch (sort) {
    case "featured":
    case "verified_first": {
      const rankDiff = displayRank(a.claim_status, sort) - displayRank(b.claim_status, sort)
      if (rankDiff !== 0) return rankDiff
      return compareNames(a.name, b.name)
    }
    case "name":
    default:
      return compareNames(a.name, b.name)
  }
}

export function sortArtistsByDisplaySort(items: Artist[], sort: InventorySort): Artist[] {
  if (sort === "name") return items
  return [...items].sort((a, b) => compareArtistsByDisplaySort(a, b, sort))
}
