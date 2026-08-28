import type { Artist } from "@/lib/artists"
import type { InventorySort, PublicInventoryProfile } from "@/lib/types/inventory"

function claimedFirstRank(claimStatus: PublicInventoryProfile["claim_status"]): number {
  return claimStatus === "claimed" ? 0 : 1
}

function compareNames(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: "base" })
}

function parseTimestamp(value: string | undefined): number {
  const raw = value?.trim()
  if (!raw) return 0
  const ts = Date.parse(raw)
  return Number.isNaN(ts) ? 0 : ts
}

/** `name` matches GET /inventory default (`artist_name ASC`) — safe to paginate on the server. */
export function inventorySortUsesServerPagination(sort: InventorySort): boolean {
  return sort === "name"
}

export function compareInventoryProfiles(
  a: PublicInventoryProfile,
  b: PublicInventoryProfile,
  sort: InventorySort,
): number {
  switch (sort) {
    case "verified_first": {
      const rankDiff = claimedFirstRank(a.claim_status) - claimedFirstRank(b.claim_status)
      if (rankDiff !== 0) return rankDiff
      return compareNames(a.artist_name, b.artist_name)
    }
    case "newest": {
      const diff = parseTimestamp(b.created_at) - parseTimestamp(a.created_at)
      if (diff !== 0) return diff
      return compareNames(a.artist_name, b.artist_name)
    }
    case "oldest": {
      const diff = parseTimestamp(a.created_at) - parseTimestamp(b.created_at)
      if (diff !== 0) return diff
      return compareNames(a.artist_name, b.artist_name)
    }
    case "name_desc":
      return compareNames(b.artist_name, a.artist_name)
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
    case "verified_first": {
      const rankDiff = claimedFirstRank(a.claim_status) - claimedFirstRank(b.claim_status)
      if (rankDiff !== 0) return rankDiff
      return compareNames(a.name, b.name)
    }
    case "newest": {
      const diff = parseTimestamp(b.added_date) - parseTimestamp(a.added_date)
      if (diff !== 0) return diff
      return compareNames(a.name, b.name)
    }
    case "oldest": {
      const diff = parseTimestamp(a.added_date) - parseTimestamp(b.added_date)
      if (diff !== 0) return diff
      return compareNames(a.name, b.name)
    }
    case "name_desc":
      return compareNames(b.name, a.name)
    case "name":
    default:
      return compareNames(a.name, b.name)
  }
}

export function sortArtistsByDisplaySort(items: Artist[], sort: InventorySort): Artist[] {
  if (sort === "name") return items
  return [...items].sort((a, b) => compareArtistsByDisplaySort(a, b, sort))
}
