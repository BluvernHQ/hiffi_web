import {
  fetchAllInventoryProfiles,
  fetchInventoryPage,
  fetchInventoryTotal,
  type InventoryPageParams,
} from "@/lib/artist-index/fetch-inventory"
import { sortInventoryProfiles } from "@/lib/artist-index/inventory-sort"
import type { PublicInventoryClaimStatus, PublicInventoryProfile } from "@/lib/types/inventory"

type InventoryFilterParams = Omit<InventoryPageParams, "limit" | "offset" | "claim_status">

/** After recently-claimed: pending (under review), then unclaimed — each A→Z. */
const OTHER_SEGMENTS: PublicInventoryClaimStatus[] = ["pending", "unclaimed"]

/**
 * Recently claimed profiles first (`updated_at` desc), then pending, then unclaimed.
 * Claimed set is loaded fully (small); other segments paginate via GET /inventory.
 */
export async function fetchVerifiedFirstInventorySlice(
  params: InventoryFilterParams,
  offset: number,
  limit: number,
): Promise<{ items: PublicInventoryProfile[]; total: number; hasMore: boolean }> {
  if (limit <= 0) {
    const total = await fetchInventoryTotal(params)
    return { items: [], total, hasMore: offset < total }
  }

  const [claimedRaw, otherTotals] = await Promise.all([
    fetchAllInventoryProfiles({ ...params, claim_status: "claimed" }),
    Promise.all(
      OTHER_SEGMENTS.map((claim_status) => fetchInventoryTotal({ ...params, claim_status })),
    ),
  ])

  const claimedSorted = sortInventoryProfiles(claimedRaw, "verified_first")
  const claimedTotal = claimedSorted.length
  const catalogTotal = claimedTotal + otherTotals.reduce((sum, count) => sum + count, 0)

  const items: PublicInventoryProfile[] = []
  let remainingOffset = offset
  let remainingLimit = limit

  if (remainingOffset < claimedTotal) {
    const claimedSlice = claimedSorted.slice(
      remainingOffset,
      remainingOffset + remainingLimit,
    )
    items.push(...claimedSlice)
    remainingLimit -= claimedSlice.length
    remainingOffset = 0
  } else {
    remainingOffset -= claimedTotal
  }

  for (let index = 0; index < OTHER_SEGMENTS.length && remainingLimit > 0; index += 1) {
    const claim_status = OTHER_SEGMENTS[index]
    const segmentTotal = otherTotals[index]

    if (remainingOffset >= segmentTotal) {
      remainingOffset -= segmentTotal
      continue
    }

    const localOffset = remainingOffset
    const fetchLimit = Math.min(remainingLimit, segmentTotal - localOffset)
    const page = await fetchInventoryPage({
      ...params,
      claim_status,
      offset: localOffset,
      limit: fetchLimit,
    })

    items.push(...page.items)
    remainingLimit -= page.items.length
    remainingOffset = 0
  }

  const sliceEnd = offset + limit
  return {
    items,
    total: catalogTotal,
    hasMore: sliceEnd < catalogTotal,
  }
}
