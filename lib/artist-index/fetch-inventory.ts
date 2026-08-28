import { cache } from "react"
import { getApiBaseUrl } from "@/lib/config"
import { unwrapSuccessData } from "@/lib/api/envelope"
import type {
  InventoryProfileListResponse,
  PublicInventoryClaimStatus,
  PublicInventoryProfile,
} from "@/lib/types/inventory"
import { normalizePublicInventoryProfile } from "@/lib/types/inventory"
import {
  ARTIST_INVENTORY_CACHE_TAG,
  artistInventoryUsernameTag,
} from "@/lib/artist-index/inventory-cache-tags"

const REVALIDATE_SECONDS = 300
const MAX_PAGE_SIZE = 100

export class InventoryFetchError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "InventoryFetchError"
    this.status = status
  }
}

export type InventoryPageParams = {
  limit: number
  offset: number
  search?: string
  username?: string
  location?: string
  city?: string
  genre?: string
  claim_status?: PublicInventoryClaimStatus
}

export async function fetchInventoryPage(
  params: InventoryPageParams,
): Promise<InventoryProfileListResponse> {
  const sp = new URLSearchParams({
    limit: String(Math.min(params.limit, MAX_PAGE_SIZE)),
    offset: String(params.offset),
  })
  if (params.search?.trim()) sp.set("search", params.search.trim())
  if (params.username?.trim()) sp.set("username", params.username.trim().toLowerCase())
  if (params.location?.trim()) sp.set("location", params.location.trim())
  else if (params.city?.trim()) sp.set("city", params.city.trim())
  if (params.genre?.trim()) sp.set("genre", params.genre.trim().toLowerCase())
  if (params.claim_status) sp.set("claim_status", params.claim_status)

  const usernameTag = params.username?.trim()
    ? artistInventoryUsernameTag(params.username)
    : null

  const res = await fetch(`${getApiBaseUrl()}/inventory?${sp.toString()}`, {
    headers: { Accept: "application/json" },
    next: {
      revalidate: REVALIDATE_SECONDS,
      tags: usernameTag
        ? [ARTIST_INVENTORY_CACHE_TAG, usernameTag]
        : [ARTIST_INVENTORY_CACHE_TAG],
    },
  })

  if (!res.ok) {
    throw new InventoryFetchError(`GET /inventory failed (${res.status})`, res.status)
  }

  const json = await res.json()
  const data = unwrapSuccessData<InventoryProfileListResponse>(json)
  const itemCount = data.items?.length ?? 0

  return {
    items: (data.items ?? []).map((item) =>
      normalizePublicInventoryProfile(item as unknown as Record<string, unknown>),
    ),
    limit: Number(data.limit ?? params.limit),
    offset: Number(data.offset ?? params.offset),
    count: Number(data.count ?? itemCount),
    total: Number(data.total ?? data.count ?? itemCount),
    has_more: Boolean(data.has_more),
    ...(data.search ? { search: data.search } : {}),
    ...(data.username ? { username: data.username } : {}),
    ...(data.location ? { location: data.location } : {}),
    ...(data.genre ? { genre: data.genre } : {}),
    ...(data.claim_status ? { claim_status: data.claim_status } : {}),
  }
}

/** Catalog size for hub copy — uses `total` from a minimal list request. */
export async function fetchInventoryTotal(
  params: Omit<InventoryPageParams, "limit" | "offset"> = {},
): Promise<number> {
  const result = await fetchInventoryPage({ ...params, limit: 1, offset: 0 })
  return result.total
}

export async function fetchAllInventoryProfiles(
  params: Omit<InventoryPageParams, "limit" | "offset"> = {},
): Promise<PublicInventoryProfile[]> {
  const all: PublicInventoryProfile[] = []
  let offset = 0
  const limit = MAX_PAGE_SIZE

  for (let page = 0; page < 500; page += 1) {
    const result = await fetchInventoryPage({
      limit,
      offset,
      ...params,
    })
    all.push(...result.items)
    if (!result.has_more) break
    offset += limit
  }

  return all
}

export const fetchInventoryProfileByUsername = cache(
  async (username: string): Promise<PublicInventoryProfile | null> => {
    const slug = username.trim().toLowerCase()
    if (!slug) return null

    try {
      const result = await fetchInventoryPage({
        limit: 10,
        offset: 0,
        username: slug,
      })
      return result.items.find((item) => item.username === slug) ?? null
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("[artist-index] fetchInventoryProfileByUsername failed:", error)
      }
      return null
    }
  },
)
