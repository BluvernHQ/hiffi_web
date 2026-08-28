import {
  fetchInventoryPage,
  fetchInventoryTotal,
  type InventoryPageParams,
} from "@/lib/artist-index/fetch-inventory"
import type { PublicInventoryProfile } from "@/lib/types/inventory"

const MERGE_PAGE_SIZE = 100

type InventoryFilterParams = Omit<InventoryPageParams, "limit" | "offset" | "claim_status">

function compareProfileNames(a: PublicInventoryProfile, b: PublicInventoryProfile): number {
  return a.artist_name.localeCompare(b.artist_name, undefined, { sensitivity: "base" })
}

type StatusStream = {
  claimStatus: "pending" | "unclaimed"
  items: PublicInventoryProfile[]
  index: number
  offset: number
  hasMore: boolean
}

async function loadStreamPage(
  stream: StatusStream,
  params: InventoryFilterParams,
): Promise<void> {
  if (!stream.hasMore) return
  const result = await fetchInventoryPage({
    ...params,
    claim_status: stream.claimStatus,
    limit: MERGE_PAGE_SIZE,
    offset: stream.offset,
  })
  stream.items = result.items
  stream.index = 0
  stream.offset += result.items.length
  stream.hasMore = result.has_more
}

async function ensureStreamHead(
  stream: StatusStream,
  params: InventoryFilterParams,
): Promise<boolean> {
  while (stream.index >= stream.items.length && stream.hasMore) {
    await loadStreamPage(stream, params)
  }
  return stream.index < stream.items.length
}

/**
 * Page through pending + unclaimed profiles merged A→Z without loading the full catalog.
 */
async function fetchNonClaimedNameSlice(
  params: InventoryFilterParams,
  sliceOffset: number,
  limit: number,
): Promise<PublicInventoryProfile[]> {
  if (limit <= 0) return []

  const pending: StatusStream = {
    claimStatus: "pending",
    items: [],
    index: 0,
    offset: 0,
    hasMore: true,
  }
  const unclaimed: StatusStream = {
    claimStatus: "unclaimed",
    items: [],
    index: 0,
    offset: 0,
    hasMore: true,
  }

  const picked: PublicInventoryProfile[] = []
  let skipped = 0

  while (picked.length < limit) {
    const [hasPending, hasUnclaimed] = await Promise.all([
      ensureStreamHead(pending, params),
      ensureStreamHead(unclaimed, params),
    ])

    if (!hasPending && !hasUnclaimed) break

    let next: PublicInventoryProfile | null = null

    if (hasPending && hasUnclaimed) {
      const pendingItem = pending.items[pending.index]
      const unclaimedItem = unclaimed.items[unclaimed.index]
      if (compareProfileNames(pendingItem, unclaimedItem) <= 0) {
        next = pendingItem
        pending.index += 1
      } else {
        next = unclaimedItem
        unclaimed.index += 1
      }
    } else if (hasPending) {
      next = pending.items[pending.index]
      pending.index += 1
    } else {
      next = unclaimed.items[unclaimed.index]
      unclaimed.index += 1
    }

    if (skipped < sliceOffset) {
      skipped += 1
      continue
    }

    picked.push(next)
  }

  return picked
}

/** Claimed profiles first, then pending + unclaimed A→Z — paginated without a full-catalog fetch. */
export async function fetchVerifiedFirstInventorySlice(
  params: InventoryFilterParams,
  offset: number,
  limit: number,
): Promise<{ items: PublicInventoryProfile[]; total: number; hasMore: boolean }> {
  const [catalogTotal, claimedTotal] = await Promise.all([
    fetchInventoryTotal(params),
    fetchInventoryTotal({ ...params, claim_status: "claimed" }),
  ])

  const items: PublicInventoryProfile[] = []
  const sliceEnd = offset + limit

  if (offset < claimedTotal) {
    const claimedLimit = Math.min(limit, claimedTotal - offset)
    const claimedPage = await fetchInventoryPage({
      ...params,
      claim_status: "claimed",
      offset,
      limit: claimedLimit,
    })
    items.push(...claimedPage.items)
  }

  if (items.length < limit && sliceEnd > claimedTotal) {
    const nonClaimedOffset = Math.max(0, offset - claimedTotal)
    const remainder = await fetchNonClaimedNameSlice(params, nonClaimedOffset, limit - items.length)
    items.push(...remainder)
  }

  return {
    items,
    total: catalogTotal,
    hasMore: sliceEnd < catalogTotal,
  }
}
