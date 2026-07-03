"use client"

import Link from "next/link"
import type { ArtistDirectoryFilterOption } from "@/lib/artist-directory"
import {
  artistDirectoryFilterSeoHref,
  HUB_FILTER_LABEL_OVERRIDES,
} from "@/lib/artist-directory"
import { cn } from "@/lib/utils"

type ArtistFilterBarProps = {
  filters: ArtistDirectoryFilterOption[]
  activeFilterIds: string[]
  onToggleFilter: (filterId: string) => void
  variant?: "default" | "inline"
  emphasizeAtlanta?: boolean
}

function getFilterLabel(filter: ArtistDirectoryFilterOption): string {
  if (filter.slug && HUB_FILTER_LABEL_OVERRIDES[filter.slug]) {
    return HUB_FILTER_LABEL_OVERRIDES[filter.slug]!
  }
  return filter.label
}

function pillClass(active: boolean, inline: boolean) {
  return cn(
    "inline-flex shrink-0 items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors sm:px-3.5 sm:py-1.5 sm:text-sm",
    active
      ? "border-[#E8192C] bg-[#E8192C] text-white"
      : inline
        ? "border-[#E8192C]/15 bg-[#E8192C]/[0.05] text-foreground hover:border-[#E8192C]/30 hover:bg-[#E8192C]/10"
        : "border-border bg-white text-foreground hover:border-[#E8192C]/30 hover:bg-[#E8192C]/5",
  )
}

export function ArtistFilterBar({
  filters,
  activeFilterIds,
  onToggleFilter,
  variant = "default",
  emphasizeAtlanta = false,
}: ArtistFilterBarProps) {
  if (filters.length === 0) return null

  const isInline = variant === "inline"

  return (
    <div
      className={cn(
        isInline ? "min-w-0 flex-1 overflow-x-auto" : "-mx-1 overflow-x-auto px-1 pb-1",
      )}
    >
      <div
        className={cn(
          "flex gap-2",
          isInline ? "w-max min-w-0 pr-1" : "w-max min-w-full sm:w-auto sm:flex-wrap",
        )}
      >
        {filters.map((filter) => {
          const active = activeFilterIds.includes(filter.id)
          const seoHref = artistDirectoryFilterSeoHref(filter)
          const label = getFilterLabel(filter)
          const showAtlantaEmphasis =
            emphasizeAtlanta && filter.kind === "city" && filter.slug === "atlanta"
          const pillActive = active || showAtlantaEmphasis
          // Hub pills always toggle; SEO landing links are for inactive default-variant pills only.
          const useToggle = isInline || active

          if (seoHref && !useToggle) {
            return (
              <Link
                key={filter.id}
                href={seoHref}
                className={pillClass(pillActive, isInline)}
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
              className={pillClass(pillActive, isInline)}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
