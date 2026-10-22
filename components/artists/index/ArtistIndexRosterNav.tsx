"use client"

import Link from "next/link"
import type { MouseEvent } from "react"
import { captureRosterScroll } from "@/components/artists/index/roster-scroll"
import type { ChartSize } from "@/lib/chart-size"
import { cn } from "@/lib/utils"

type ArtistIndexRosterNavProps = {
  selected: ChartSize | null
  allHref: string
  sizeHrefs: { size: ChartSize; href: string }[]
}

function keepRosterInPlace(event: MouseEvent<HTMLAnchorElement>) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
  captureRosterScroll()
}

/** All, Top 1,000, Top 5,000, and Top 10,000. Shared by every artist index roster. */
export function ArtistIndexRosterNav({ selected, allHref, sizeHrefs }: ArtistIndexRosterNavProps) {
  const linkClass = (active: boolean) =>
    cn(
      "text-sm font-semibold underline-offset-4",
      active ? "text-[#0B0B0C] underline decoration-[#E8192C]" : "text-[#77726A] hover:text-[#0B0B0C]",
    )

  return (
    <nav aria-label="Roster" className="flex flex-wrap gap-x-4 gap-y-2">
      <Link
        href={allHref}
        scroll={false}
        onClick={keepRosterInPlace}
        aria-current={selected == null ? "page" : undefined}
        className={linkClass(selected == null)}
      >
        All
      </Link>
      {sizeHrefs.map(({ size, href }) => {
        const active = size === selected
        return (
          <Link
            key={size}
            href={href}
            scroll={false}
            onClick={keepRosterInPlace}
            aria-current={active ? "page" : undefined}
            className={cn(linkClass(active), "tabular-nums")}
          >
            Top {size.toLocaleString()}
          </Link>
        )
      })}
    </nav>
  )
}
