"use client"

import Link from "next/link"
import type { ArtistDirectoryFilterOption } from "@/lib/artist-directory"
import { artistDirectoryFilterSeoHref } from "@/lib/artist-directory"
import { cn } from "@/lib/utils"

type ArtistFilterBarProps = {
  filters: ArtistDirectoryFilterOption[]
  activeFilterIds: string[]
  onToggleFilter: (filterId: string) => void
}

const pillClass = (active: boolean) =>
  cn(
    "inline-flex shrink-0 items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors sm:text-sm sm:px-3.5 sm:py-1.5",
    active
      ? "border-[#E8192C] bg-[#E8192C] text-white"
      : "border-border bg-white text-foreground hover:border-[#E8192C]/30 hover:bg-[#E8192C]/5",
  )

export function ArtistFilterBar({ filters, activeFilterIds, onToggleFilter }: ArtistFilterBarProps) {
  if (filters.length === 0) return null

  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1">
      <div className="flex w-max min-w-full gap-2 sm:flex-wrap sm:w-auto">
        {filters.map((filter) => {
          const active = activeFilterIds.includes(filter.id)
          const seoHref = artistDirectoryFilterSeoHref(filter)
          const label = (
            <>
              {filter.label}
              <span className="ml-1.5 font-normal opacity-70">({filter.count.toLocaleString()})</span>
            </>
          )

          if (seoHref) {
            return (
              <Link
                key={filter.id}
                href={seoHref}
                aria-current={active ? "page" : undefined}
                className={pillClass(active)}
              >
                {label}
              </Link>
            )
          }

          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => onToggleFilter(filter.id)}
              aria-pressed={active}
              className={pillClass(active)}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
