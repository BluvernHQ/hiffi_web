"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { CreatorsOverview } from "@/components/admin/creators-overview"
import { CreatorsDirectory } from "@/components/admin/creators-directory"
import { CreatorDetail } from "@/components/admin/creator-detail"
import {
  creatorsDashboardHref,
  hasDirectoryQuery,
  parseCreatorsPopulation,
} from "@/lib/admin/creator-nav"
import { cn } from "@/lib/utils"

export function CreatorsPanel() {
  const searchParams = useSearchParams()
  const creator = searchParams.get("creator")?.trim()
  const showDirectory = hasDirectoryQuery(searchParams)
  const asOf = searchParams.get("as_of") || undefined
  const fromDate = searchParams.get("from_date") || undefined
  const population = parseCreatorsPopulation(searchParams.get("creators_pop"))

  if (creator) {
    return <CreatorDetail username={creator} />
  }

  const shared = {
    as_of: asOf,
    from_date: fromDate,
    creators_pop: population === "claimed" ? ("claimed" as const) : undefined,
  }

  return (
    <div className="space-y-4">
      <div className="bg-muted text-muted-foreground inline-flex h-10 items-center rounded-xl p-1">
        <Link
          href={creatorsDashboardHref({ view: "dashboard", ...shared })}
          className={cn(
            "inline-flex h-8 items-center rounded-lg px-4 text-sm font-medium transition-colors",
            !showDirectory && "bg-background text-foreground shadow-sm",
          )}
        >
          Overview
        </Link>
        <Link
          href={creatorsDashboardHref({ view: "directory", ...shared })}
          className={cn(
            "inline-flex h-8 items-center rounded-lg px-4 text-sm font-medium transition-colors",
            showDirectory && "bg-background text-foreground shadow-sm",
          )}
        >
          Directory
        </Link>
      </div>
      {showDirectory ? <CreatorsDirectory /> : <CreatorsOverview />}
    </div>
  )
}
