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
        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Search artist name, city, genre, or platform."
        className="h-12 w-full rounded-full border border-border bg-muted/40 pl-12 pr-4 text-base shadow-sm outline-none transition-[box-shadow,border-color] placeholder:text-muted-foreground focus:border-[#E8192C]/40 focus:ring-2 focus:ring-[#E8192C]/15 md:text-sm"
        aria-label="Search artists"
      />
    </div>
  )
}
