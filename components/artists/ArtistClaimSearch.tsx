"use client"

import { useCallback, useEffect, useId, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Loader2, Search } from "lucide-react"
import { ARTIST_INDEX_PATH } from "@/lib/artist-directory"
import { artistButtonSolid } from "@/components/artists/artist-styles"
import { cn } from "@/lib/utils"

type ArtistSearchSuggestion = {
  slug: string
  name: string
}

type ArtistClaimSearchProps = {
  className?: string
  size?: "default" | "large"
}

const MIN_SUGGEST_LENGTH = 2
const DEBOUNCE_MS = 220

function extractProfileSlug(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const urlMatch = trimmed.match(/artist-index\/([a-z0-9-]+)(?:\/|$|\?)/i)
  if (urlMatch?.[1]) return urlMatch[1].toLowerCase()

  if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(trimmed) && trimmed.length >= 2) {
    return trimmed.toLowerCase()
  }

  return null
}

export function ArtistClaimSearch({ className, size = "large" }: ArtistClaimSearchProps) {
  const router = useRouter()
  const listboxId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<ArtistSearchSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [fetchError, setFetchError] = useState(false)

  const navigateToProfile = useCallback(
    (slug: string) => {
      setOpen(false)
      setActiveIndex(-1)
      router.push(`${ARTIST_INDEX_PATH}/${encodeURIComponent(slug)}`)
    },
    [router],
  )

  const navigateToSearch = useCallback(
    (searchQuery: string) => {
      setOpen(false)
      setActiveIndex(-1)
      const params = new URLSearchParams({ q: searchQuery })
      router.push(`${ARTIST_INDEX_PATH}?${params.toString()}`)
    },
    [router],
  )

  const submitQuery = useCallback(
    (raw: string) => {
      const trimmed = raw.trim()
      if (!trimmed) return

      const slug = extractProfileSlug(trimmed)
      if (slug) {
        navigateToProfile(slug)
        return
      }

      if (activeIndex >= 0 && suggestions[activeIndex]) {
        navigateToProfile(suggestions[activeIndex].slug)
        return
      }

      navigateToSearch(trimmed)
    },
    [activeIndex, navigateToProfile, navigateToSearch, suggestions],
  )

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < MIN_SUGGEST_LENGTH) {
      setSuggestions([])
      setLoading(false)
      setFetchError(false)
      setOpen(false)
      setActiveIndex(-1)
      return
    }

    setLoading(true)
    setFetchError(false)
    const controller = new AbortController()

    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: trimmed })
        const res = await fetch(`/api/artist-index/search?${params.toString()}`, {
          signal: controller.signal,
        })
        if (!res.ok) throw new Error("search failed")
        const data = (await res.json()) as { items: ArtistSearchSuggestion[] }
        setSuggestions(data.items ?? [])
        setOpen(true)
        setActiveIndex(data.items?.length ? 0 : -1)
        setFetchError(false)
      } catch (error) {
        if (controller.signal.aborted) return
        setSuggestions([])
        setOpen(false)
        setFetchError(true)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, DEBOUNCE_MS)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [query])

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setActiveIndex(-1)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    return () => document.removeEventListener("mousedown", handlePointerDown)
  }, [])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    submitQuery(query)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) {
      if (event.key === "ArrowDown" && suggestions.length > 0) {
        event.preventDefault()
        setOpen(true)
        setActiveIndex(0)
      }
      return
    }

    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActiveIndex((current) => (current + 1) % suggestions.length)
      return
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveIndex((current) =>
        current <= 0 ? suggestions.length - 1 : current - 1,
      )
      return
    }

    if (event.key === "Escape") {
      event.preventDefault()
      setOpen(false)
      setActiveIndex(-1)
      return
    }
  }

  const isLarge = size === "large"
  const trimmedQuery = query.trim()
  const showDropdown = open && trimmedQuery.length >= MIN_SUGGEST_LENGTH

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <form onSubmit={handleSubmit}>
        <div
          className={cn(
            "flex flex-col gap-2 sm:flex-row sm:items-stretch",
            isLarge &&
              "sm:gap-0 sm:overflow-hidden sm:rounded-full sm:border sm:border-border sm:bg-white sm:shadow-sm sm:focus-within:ring-2 sm:focus-within:ring-[#E8192C]/15",
          )}
        >
          <div className={cn("relative min-w-0 flex-1", isLarge ? "sm:pl-1" : "")}>
            <Search
              className={cn(
                "pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground",
                isLarge ? "left-4 h-5 w-5" : "left-3 h-4 w-4",
              )}
              aria-hidden
            />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => {
                if (trimmedQuery.length >= MIN_SUGGEST_LENGTH && suggestions.length > 0) {
                  setOpen(true)
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder="Stage name or hiffi.com/artist-index/your-name"
              className={cn(
                "w-full border border-border bg-white text-foreground outline-none transition-[box-shadow,border-color] placeholder:text-muted-foreground focus:border-[#E8192C]/40 focus:ring-2 focus:ring-[#E8192C]/15",
                isLarge
                  ? "h-12 rounded-full pl-12 pr-10 text-sm sm:h-14 sm:rounded-none sm:border-0 sm:text-base sm:focus:ring-0"
                  : "h-10 rounded-full pl-10 pr-9 text-sm",
              )}
              role="combobox"
              aria-expanded={showDropdown}
              aria-controls={listboxId}
              aria-autocomplete="list"
              aria-activedescendant={
                activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
              }
              aria-label="Search for your artist profile"
            />
            {loading ? (
              <Loader2
                className={cn(
                  "pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground",
                  isLarge ? "right-4 sm:right-3" : "right-3",
                )}
                aria-hidden
              />
            ) : null}
          </div>
          <button
            type="submit"
            className={cn(
              artistButtonSolid,
              "shrink-0",
              isLarge ? "h-12 px-6 sm:h-auto sm:rounded-none sm:rounded-r-full sm:px-8" : "h-10 px-5",
            )}
          >
            Find profile
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </form>

      {showDropdown ? (
        <div
          className={cn(
            "absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-white shadow-lg",
            isLarge && "sm:mt-3",
          )}
        >
          {suggestions.length > 0 ? (
            <ul id={listboxId} role="listbox" aria-label="Artist suggestions" className="py-1">
              {suggestions.map((item, index) => (
                <li key={item.slug} role="presentation">
                  <button
                    type="button"
                    id={`${listboxId}-option-${index}`}
                    role="option"
                    aria-selected={activeIndex === index}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors",
                      activeIndex === index ? "bg-[#E8192C]/8 text-foreground" : "hover:bg-muted/50",
                    )}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => navigateToProfile(item.slug)}
                  >
                    <span>
                      <span className="font-semibold text-foreground">{item.name}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        hiffi.com/artist-index/{item.slug}
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          ) : !loading ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              {fetchError ? (
                "Could not load suggestions. Press Find profile to search the directory."
              ) : (
                <>
                  No matching profiles.{" "}
                  <button
                    type="button"
                    className="font-medium text-[#E8192C] hover:underline"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => navigateToSearch(trimmedQuery)}
                  >
                    Search the full index
                  </button>
                </>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
