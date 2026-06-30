"use client"

import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

type ArtistSearchProps = {
  query: string
  onQueryChange: (query: string) => void
  variant?: "default" | "hub"
  embedded?: boolean
  className?: string
}

export function ArtistSearch({
  query,
  onQueryChange,
  variant = "default",
  embedded = false,
  className,
}: ArtistSearchProps) {
  const isHub = variant === "hub"

  if (isHub && embedded) {
    return (
      <div
        className={cn(
          "flex min-w-[12rem] flex-1 items-center gap-2 rounded-xl border border-[#E8192C]/15 bg-[#E8192C]/[0.06] px-3 py-2.5 sm:min-w-[16rem] sm:max-w-md lg:max-w-lg",
          className,
        )}
      >
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search by artist name"
          className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground focus:ring-0"
          aria-label="Search artists"
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative flex items-center gap-2",
        isHub &&
          "rounded-2xl border border-[#E8192C]/25 bg-[#E8192C]/[0.06] px-3 py-2 shadow-sm sm:px-4",
        className,
      )}
    >
      <Search
        className={cn(
          "pointer-events-none shrink-0 text-muted-foreground",
          isHub ? "h-4 w-4" : "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2",
        )}
        aria-hidden
      />
      <input
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder={
          isHub
            ? "Search by artist name"
            : "Search artists…"
        }
        className={cn(
          "w-full text-sm outline-none transition-[box-shadow,border-color] placeholder:text-muted-foreground",
          isHub
            ? "min-w-0 flex-1 border-0 bg-transparent py-1.5 focus:ring-0"
            : "h-10 rounded-full border border-border bg-muted/40 pl-10 pr-4 shadow-sm focus:border-[#E8192C]/40 focus:ring-2 focus:ring-[#E8192C]/15",
        )}
        aria-label="Search artists"
      />
    </div>
  )
}
