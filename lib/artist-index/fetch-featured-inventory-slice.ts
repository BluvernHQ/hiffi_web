import {
  fetchInventoryPage,
  fetchInventoryTotal,
  type InventoryPageParams,
} from "@/lib/artist-index/fetch-inventory"
import type { PublicInventoryClaimStatus, PublicInventoryProfile } from "@/lib/types/inventory"

type InventoryFilterParams = Omit<InventoryPageParams, "limit" | "offset" | "claim_status" | "sort">

const FEATURED_SEGMENTS: PublicInventoryClaimStatus[] = ["claimed", "pending", "unclaimed"]

/**
 * Claimed → pending → unclaimed (A→Z within each tier) via claim_status slices.
 * Matches GET /inventory?sort=featured without relying on backend sort support.
 */
export async function fetchFeaturedInventorySlice(
  params: InventoryFilterParams,
  offset: number,
  limit: number,
): Promise<{ items: PublicInventoryProfile[]; total: number; hasMore: boolean }> {
  if (limit <= 0) {
    const total = await fetchInventoryTotal(params)
    return { items: [], total, hasMore: offset < total }
  }

  const segmentTotals = await Promise.all(
    FEATURED_SEGMENTS.map((claim_status) => fetchInventoryTotal({ ...params, claim_status })),
  )
  const catalogTotal = segmentTotals.reduce((sum, count) => sum + count, 0)

  const items: PublicInventoryProfile[] = []
  let remainingOffset = offset
  let remainingLimit = limit

  for (let index = 0; index < FEATURED_SEGMENTS.length; index += 1) {
    if (remainingLimit <= 0) break

    const claim_status = FEATURED_SEGMENTS[index]
    const segmentTotal = segmentTotals[index]

    if (remainingOffset >= segmentTotal) {
      remainingOffset -= segmentTotal
      continue
    }

    const localOffset = remainingOffset
    const fetchLimit = Math.min(remainingLimit, segmentTotal - localOffset)
    const page = await fetchInventoryPage({
      ...params,
      claim_status,
      sort: "name",
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
