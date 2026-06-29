"use client"

import { Search } from "lucide-react"

type ArtistSearchProps = {
  query: string
  onQueryChange: (query: string) => void
}

export function ArtistSearch({ query, onQueryChange }: ArtistSearchProps) {
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Search artists…"
        className="h-10 w-full rounded-full border border-border bg-muted/40 pl-10 pr-4 text-sm shadow-sm outline-none transition-[box-shadow,border-color] placeholder:text-muted-foreground focus:border-[#E8192C]/40 focus:ring-2 focus:ring-[#E8192C]/15"
        aria-label="Search artists"
      />
    </div>
  )
}
