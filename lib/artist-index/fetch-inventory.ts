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
const FULL_CATALOG_CONCURRENCY = 4

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
    const bodySnippet = await res
      .text()
      .then((text) => text.replace(/\s+/g, " ").slice(0, 200))
      .catch(() => "")
    // `server` / `cf-ray` tell a Cloudflare block apart from a backend rejection in server logs.
    console.error("[artist-index] GET /inventory failed", {
      status: res.status,
      url: `${getApiBaseUrl()}/inventory?${sp.toString()}`,
      server: res.headers.get("server"),
      cfRay: res.headers.get("cf-ray"),
      body: bodySnippet,
    })
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
  const first = await fetchInventoryPage({ limit: MAX_PAGE_SIZE, offset: 0, ...params })
  const all = [...first.items]
  if (!first.has_more) return all

  const total = first.total
  const pageCount = Math.ceil(total / MAX_PAGE_SIZE)
  if (pageCount <= 1) return all

  // The full catalog is ~170 pages; firing them all at once trips the API's per-IP rate limit
  // and 403s every other server request from this host.
  const offsets = Array.from({ length: pageCount - 1 }, (_, index) => (index + 1) * MAX_PAGE_SIZE)
  const pages: PublicInventoryProfile[][] = new Array(offsets.length)
  let cursor = 0

  await Promise.all(
    Array.from({ length: Math.min(FULL_CATALOG_CONCURRENCY, offsets.length) }, async () => {
      while (cursor < offsets.length) {
        const index = cursor++
        const page = await fetchInventoryPage({
          limit: MAX_PAGE_SIZE,
          offset: offsets[index],
          ...params,
        })
        pages[index] = page.items
      }
    }),
  )

  for (const items of pages) {
    all.push(...items)
  }

  return all
}

export const fetchInventoryProfileByUsername = cache(
  async (username: string): Promise<PublicInventoryProfile | null> => {
    const slug = username.trim().toLowerCase()
    if (!slug) return null

    try {
      // Backend `username` is a partial/LIKE filter. Short usernames (e.g. "fin")
      // can sit after dozens of longer matches — page until an exact username hit.
      const pageSize = MAX_PAGE_SIZE
      let offset = 0

      for (let page = 0; page < 30; page += 1) {
        const result = await fetchInventoryPage({
          limit: pageSize,
          offset,
          username: slug,
        })

        const exact = result.items.find((item) => item.username === slug)
        if (exact) return exact

        if (!result.has_more || result.items.length === 0) break
        offset += result.items.length
      }

      // Fallback when username filter returns nothing useful: search + exact match.
      offset = 0
      for (let page = 0; page < 30; page += 1) {
        const result = await fetchInventoryPage({
          limit: pageSize,
          offset,
          search: slug,
        })

        const exact = result.items.find((item) => item.username === slug)
        if (exact) return exact

        if (!result.has_more || result.items.length === 0) break
        offset += result.items.length
      }

      return null
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("[artist-index] fetchInventoryProfileByUsername failed:", error)
      }
      return null
    }
  },
)
