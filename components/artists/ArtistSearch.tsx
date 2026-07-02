"use client"

import { useCallback, useEffect, useId, useRef, useState } from "react"
import { ArrowRight, Loader2, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

type ArtistSearchSuggestion = {
  slug: string
  name: string
}

type ArtistSearchProps = {
  query: string
  onQueryChange: (query: string) => void
  onSubmit?: (query: string) => void
  onProfileSelect?: (slug: string) => void
  /** Hub: no typeahead match — clear name search and browse active filters. */
  onSearchAllProfiles?: () => void
  variant?: "default" | "hub"
  className?: string
  loading?: boolean
}

const MIN_SUGGEST_LENGTH = 2
const SUGGEST_DEBOUNCE_MS = 220

/** Profile slug from a pasted artist-index URL only — not bare typed text. */
function extractProfileSlugFromUrl(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const urlMatch = trimmed.match(/artist-index\/([a-z0-9_-]+)(?:\/|$|\?)/i)
  if (urlMatch?.[1]) return urlMatch[1].toLowerCase()

  return null
}

export function ArtistSearch({
  query,
  onQueryChange,
  onSubmit,
  onProfileSelect,
  onSearchAllProfiles,
  variant = "default",
  className,
  loading = false,
}: ArtistSearchProps) {
  const isHub = variant === "hub"
  const listboxId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<ArtistSearchSuggestion[]>([])
  const activeIndexRef = useRef(-1)
  const suppressSuggestionsOpenRef = useRef(false)

  const [suggestions, setSuggestions] = useState<ArtistSearchSuggestion[]>([])
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [fetchError, setFetchError] = useState(false)

  suggestionsRef.current = suggestions
  activeIndexRef.current = activeIndex

  const trimmedQuery = query.trim()
  const showDropdown = isHub && open && trimmedQuery.length >= MIN_SUGGEST_LENGTH
  const showSpinner = loading || suggestLoading

  const closeDropdown = useCallback(() => {
    setOpen(false)
    setActiveIndex(-1)
  }, [])

  const dismissSuggestions = useCallback(() => {
    suppressSuggestionsOpenRef.current = true
    closeDropdown()
  }, [closeDropdown])

  const selectProfile = useCallback(
    (slug: string) => {
      dismissSuggestions()
      onProfileSelect?.(slug)
    },
    [dismissSuggestions, onProfileSelect],
  )

  const submitDirectorySearch = useCallback(
    (raw: string, options?: { updateQuery?: boolean }) => {
      const trimmed = raw.trim()
      if (!trimmed) return
      dismissSuggestions()
      if (options?.updateQuery !== false) {
        onQueryChange(trimmed)
      }
      onSubmit?.(trimmed)
    },
    [dismissSuggestions, onQueryChange, onSubmit],
  )

  const submitHubSearch = useCallback(
    (raw: string) => {
      const trimmed = raw.trim()
      if (!trimmed) return

      const pastedSlug = extractProfileSlugFromUrl(trimmed)
      if (pastedSlug) {
        selectProfile(pastedSlug)
        return
      }

      submitDirectorySearch(trimmed)
    },
    [selectProfile, submitDirectorySearch],
  )

  const handleSearchAllProfiles = useCallback(() => {
    if (!trimmedQuery) return
    dismissSuggestions()
    if (onSearchAllProfiles) {
      onSearchAllProfiles()
      return
    }
    submitDirectorySearch(trimmedQuery)
  }, [dismissSuggestions, onSearchAllProfiles, submitDirectorySearch, trimmedQuery])

  const handleClear = useCallback(() => {
    dismissSuggestions()
    setSuggestions([])
    setFetchError(false)
    inputRef.current?.focus()
    onSubmit?.("")
  }, [dismissSuggestions, onSubmit])

  useEffect(() => {
    if (!isHub) return

    if (trimmedQuery.length < MIN_SUGGEST_LENGTH) {
      suppressSuggestionsOpenRef.current = false
      setSuggestions([])
      setSuggestLoading(false)
      setFetchError(false)
      closeDropdown()
      return
    }

    suppressSuggestionsOpenRef.current = false
    setSuggestLoading(true)
    setFetchError(false)
    const controller = new AbortController()

    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: trimmedQuery })
        const res = await fetch(`/api/artist-index/search?${params.toString()}`, {
          signal: controller.signal,
        })
        if (!res.ok) throw new Error("search failed")
        const data = (await res.json()) as { items: ArtistSearchSuggestion[] }
        const items = data.items ?? []
        setSuggestions(items)
        if (!suppressSuggestionsOpenRef.current) {
          setOpen(true)
          setActiveIndex(items.length ? 0 : -1)
        } else {
          setActiveIndex(-1)
        }
        setFetchError(false)
      } catch (error) {
        if (controller.signal.aborted) return
        setSuggestions([])
        closeDropdown()
        setFetchError(true)
      } finally {
        if (!controller.signal.aborted) setSuggestLoading(false)
      }
    }, SUGGEST_DEBOUNCE_MS)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [closeDropdown, isHub, trimmedQuery])

  useEffect(() => {
    if (!isHub) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeDropdown()
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    return () => document.removeEventListener("mousedown", handlePointerDown)
  }, [closeDropdown, isHub])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isHub) {
      dismissSuggestions()
      submitHubSearch(query)
      return
    }
    submitLegacySearch(query)
  }

  const submitLegacySearch = (raw: string) => {
    const trimmed = raw.trim()
    if (!trimmed) return
    closeDropdown()
    const pastedSlug = extractProfileSlugFromUrl(trimmed)
    if (pastedSlug) {
      selectProfile(pastedSlug)
      return
    }
    if (activeIndexRef.current >= 0 && suggestionsRef.current[activeIndexRef.current]) {
      selectProfile(suggestionsRef.current[activeIndexRef.current].slug)
      return
    }
    submitDirectorySearch(trimmed, { updateQuery: false })
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      if (query) {
        event.preventDefault()
        handleClear()
      } else {
        closeDropdown()
      }
      return
    }

    if (event.key === "Enter" && isHub) {
      event.preventDefault()
      dismissSuggestions()
      if (trimmedQuery) submitHubSearch(trimmedQuery)
      return
    }

    if (!isHub || !open || suggestions.length === 0) {
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
      setActiveIndex((current) => (current <= 0 ? suggestions.length - 1 : current - 1))
    }
  }

  const inputClassName = cn(
    "min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground focus:ring-0 sm:text-base",
    isHub && "py-2.5 sm:py-3",
  )

  const fieldShell = (
    <div
      className={cn(
        "relative flex min-w-0 flex-1 items-center gap-2.5",
        isHub
          ? "rounded-2xl border border-[#E8192C]/20 bg-white px-3 shadow-sm transition-[border-color,box-shadow] focus-within:border-[#E8192C]/45 focus-within:ring-2 focus-within:ring-[#E8192C]/12 sm:px-4"
          : "h-10 rounded-full border border-border bg-muted/40 px-3 shadow-sm transition-[border-color,box-shadow] focus-within:border-[#E8192C]/40 focus-within:ring-2 focus-within:ring-[#E8192C]/15",
      )}
    >
      <Search
        className={cn(
          "pointer-events-none shrink-0 text-muted-foreground",
          isHub ? "h-5 w-5" : "h-4 w-4",
        )}
        aria-hidden
      />
      <input
        ref={inputRef}
        type="text"
        inputMode="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        onFocus={() => {
          if (suppressSuggestionsOpenRef.current) return
          if (isHub && trimmedQuery.length >= MIN_SUGGEST_LENGTH && suggestions.length > 0) {
            setOpen(true)
          }
        }}
        onKeyDown={handleKeyDown}
        placeholder={isHub ? "Search by artist name" : "Search artists…"}
        className={inputClassName}
        role={isHub ? "combobox" : undefined}
        aria-expanded={isHub ? showDropdown : undefined}
        aria-controls={isHub ? listboxId : undefined}
        aria-autocomplete={isHub ? "list" : undefined}
        aria-activedescendant={
          isHub && activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
        }
        aria-label="Search artists"
        enterKeyHint="search"
        autoComplete="off"
      />
      {showSpinner ? (
        <Loader2
          className="h-4 w-4 shrink-0 animate-spin text-muted-foreground"
          aria-hidden
        />
      ) : query ? (
        <button
          type="button"
          onClick={handleClear}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
    </div>
  )

  if (!isHub) {
    return (
      <form onSubmit={handleSubmit} className={cn("w-full", className)}>
        {fieldShell}
      </form>
    )
  }

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <form onSubmit={handleSubmit}>{fieldShell}</form>

      {showDropdown ? (
        <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-white shadow-lg sm:mt-2.5">
          {suggestions.length > 0 ? (
            <ul
              id={listboxId}
              role="listbox"
              aria-label="Artist suggestions"
              className="max-h-[min(18rem,50vh)] overflow-y-auto overscroll-contain py-1"
            >
              {suggestions.map((item, index) => (
                <li key={item.slug} role="presentation">
                  <button
                    type="button"
                    id={`${listboxId}-option-${index}`}
                    role="option"
                    aria-selected={activeIndex === index}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors",
                      activeIndex === index
                        ? "bg-[#E8192C]/8 text-foreground"
                        : "hover:bg-muted/50",
                    )}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectProfile(item.slug)}
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
          ) : !suggestLoading ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              {fetchError ? (
                "Could not load suggestions. Press Enter to browse the directory."
              ) : (
                <>
                  No quick matches.{" "}
                  <button
                    type="button"
                    className="font-medium text-[#E8192C] hover:underline"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={handleSearchAllProfiles}
                  >
                    Search all profiles
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
