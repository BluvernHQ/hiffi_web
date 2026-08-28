import { ARTIST_DIRECTORY_PAGE_SIZE, ARTIST_INDEX_PATH } from "@/lib/artist-directory"

const RETURN_URL_KEY = "hiffi:artist-index-return-url"
const NAV_CONTEXT_KEY = "hiffi:artist-index-nav-context"

export type ArtistDirectoryNavContext = {
  returnUrl: string
  query: string
  activeFilterIds: string[]
  page: number
  slugs: string[]
  totalMatches: number
  currentIndex: number
}

export function isArtistDirectoryListingPath(pathname: string): boolean {
  if (pathname === ARTIST_INDEX_PATH) return true
  if (pathname.startsWith(`${ARTIST_INDEX_PATH}/city/`)) return true
  if (pathname.startsWith(`${ARTIST_INDEX_PATH}/genre/`)) return true
  return false
}

function normalizeReturnUrl(returnUrl: string): string | null {
  const withoutHash = returnUrl.split("#")[0]
  let pathname = withoutHash
  let search = ""

  if (withoutHash.startsWith("http://") || withoutHash.startsWith("https://")) {
    try {
      const url = new URL(withoutHash)
      pathname = url.pathname
      search = url.search
    } catch {
      return null
    }
  } else {
    const queryIndex = withoutHash.indexOf("?")
    if (queryIndex >= 0) {
      pathname = withoutHash.slice(0, queryIndex)
      search = withoutHash.slice(queryIndex)
    }
  }

  if (!pathname.startsWith("/")) pathname = `/${pathname}`
  if (!isArtistDirectoryListingPath(pathname)) return null

  return `${pathname}${search}`
}

export function rememberArtistDirectoryReturnUrl(returnUrl?: string): void {
  if (typeof window === "undefined") return

  const candidate = returnUrl ?? `${window.location.pathname}${window.location.search}`
  const normalized = normalizeReturnUrl(candidate)
  if (!normalized) return

  sessionStorage.setItem(RETURN_URL_KEY, normalized)
}

export function getArtistDirectoryReturnUrl(
  fallback: string = ARTIST_INDEX_PATH,
): string {
  if (typeof window === "undefined") return fallback

  const stored = sessionStorage.getItem(RETURN_URL_KEY)
  if (!stored) return fallback

  return normalizeReturnUrl(stored) ?? fallback
}

export function saveArtistDirectoryNavContext(
  context: Omit<ArtistDirectoryNavContext, "currentIndex"> & { currentIndex?: number },
): void {
  if (typeof window === "undefined") return

  const payload: ArtistDirectoryNavContext = {
    ...context,
    currentIndex: context.currentIndex ?? -1,
  }

  sessionStorage.setItem(NAV_CONTEXT_KEY, JSON.stringify(payload))
  rememberArtistDirectoryReturnUrl(context.returnUrl)
}

export function getArtistDirectoryNavContext(): ArtistDirectoryNavContext | null {
  if (typeof window === "undefined") return null

  const raw = sessionStorage.getItem(NAV_CONTEXT_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as ArtistDirectoryNavContext
    if (
      !parsed ||
      typeof parsed.returnUrl !== "string" ||
      !Array.isArray(parsed.slugs) ||
      typeof parsed.totalMatches !== "number"
    ) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function setArtistDirectoryNavSelection(slug: string): void {
  const context = getArtistDirectoryNavContext()
  if (!context) return

  const index = context.slugs.indexOf(slug)
  if (index < 0) return

  saveArtistDirectoryNavContext({ ...context, currentIndex: index })
}

export function syncArtistDirectoryNavSelection(slug: string): ArtistDirectoryNavContext | null {
  const context = getArtistDirectoryNavContext()
  if (!context) return null

  const index = context.slugs.indexOf(slug)
  if (index < 0) return context

  if (index === context.currentIndex) return context

  const next = { ...context, currentIndex: index }
  saveArtistDirectoryNavContext(next)
  return next
}

export function getArtistDirectoryNavPosition(context: ArtistDirectoryNavContext): number {
  if (context.currentIndex < 0) return 0
  return (context.page - 1) * ARTIST_DIRECTORY_PAGE_SIZE + context.currentIndex + 1
}

export function canNavigateArtistDirectoryPrev(context: ArtistDirectoryNavContext): boolean {
  return context.currentIndex >= 0 && getArtistDirectoryNavPosition(context) > 1
}

export function canNavigateArtistDirectoryNext(context: ArtistDirectoryNavContext): boolean {
  if (context.currentIndex < 0) return false
  return getArtistDirectoryNavPosition(context) < context.totalMatches
}

function updateReturnUrlPage(returnUrl: string, page: number): string {
  const [path, search = ""] = returnUrl.split("?")
  const params = new URLSearchParams(search)
  if (page <= 1) params.delete("page")
  else params.set("page", String(page))
  const qs = params.toString()
  return qs ? `${path}?${qs}` : path
}

async function fetchDirectoryPageSlugs(
  query: string,
  activeFilterIds: string[],
  page: number,
): Promise<string[]> {
  const params = new URLSearchParams()
  if (query.trim()) params.set("q", query.trim())
  if (activeFilterIds.length > 0) params.set("f", activeFilterIds.join(","))
  if (page > 1) params.set("page", String(page))

  const response = await fetch(`/api/artist-index/directory?${params.toString()}`)
  if (!response.ok) throw new Error("Failed to load artist directory page")

  const data = (await response.json()) as { pageArtists?: Array<{ slug: string }> }
  return (data.pageArtists ?? []).map((artist) => artist.slug)
}

export async function resolveAdjacentArtistDirectorySlug(
  direction: "prev" | "next",
  context: ArtistDirectoryNavContext,
): Promise<{ slug: string; context: ArtistDirectoryNavContext } | null> {
  const { currentIndex, slugs, page, totalMatches, query, activeFilterIds, returnUrl } = context
  if (currentIndex < 0) return null

  if (direction === "prev") {
    if (currentIndex > 0) {
      return {
        slug: slugs[currentIndex - 1],
        context: { ...context, currentIndex: currentIndex - 1 },
      }
    }
    if (page <= 1) return null

    const prevSlugs = await fetchDirectoryPageSlugs(query, activeFilterIds, page - 1)
    if (prevSlugs.length === 0) return null

    return {
      slug: prevSlugs[prevSlugs.length - 1],
      context: {
        ...context,
        returnUrl: updateReturnUrlPage(returnUrl, page - 1),
        page: page - 1,
        slugs: prevSlugs,
        currentIndex: prevSlugs.length - 1,
      },
    }
  }

  if (currentIndex < slugs.length - 1) {
    return {
      slug: slugs[currentIndex + 1],
      context: { ...context, currentIndex: currentIndex + 1 },
    }
  }

  const viewedThroughThisPage = (page - 1) * ARTIST_DIRECTORY_PAGE_SIZE + slugs.length
  if (viewedThroughThisPage >= totalMatches) return null

  const nextSlugs = await fetchDirectoryPageSlugs(query, activeFilterIds, page + 1)
  if (nextSlugs.length === 0) return null

  return {
    slug: nextSlugs[0],
    context: {
      ...context,
      returnUrl: updateReturnUrlPage(returnUrl, page + 1),
      page: page + 1,
      slugs: nextSlugs,
      currentIndex: 0,
    },
  }
}

export function slugFromArtistProfileHref(href: string): string | null {
  const match = href.match(/\/artist-index\/([^/?#]+)/)
  const slug = match?.[1]?.trim().toLowerCase()
  if (!slug || slug === "city" || slug === "genre" || slug === "claim") return null
  return slug
}
