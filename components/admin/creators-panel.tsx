"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { CreatorsOverview } from "@/components/admin/creators-overview"
import { CreatorsDirectory } from "@/components/admin/creators-directory"
import { CreatorDetail } from "@/components/admin/creator-detail"
import {
  creatorsDashboardHref,
  hasDirectoryQuery,
  parseCreatorsMetricsSection,
  parseCreatorsPopulation,
} from "@/lib/admin/creator-nav"
import {
  CREATOR_POPULATION_LABELS,
  CREATOR_POPULATIONS,
  type CreatorPopulation,
} from "@/lib/types/admin-creators"
import { cn } from "@/lib/utils"

export function CreatorsPanel() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const creator = searchParams.get("creator")?.trim()
  const showDirectory = hasDirectoryQuery(searchParams)
  const asOf = searchParams.get("as_of") || undefined
  const fromDate = searchParams.get("from_date") || undefined
  const population = parseCreatorsPopulation(searchParams.get("creators_pop"))
  const metrics = parseCreatorsMetricsSection(searchParams.get("creators_metrics"))

  if (creator) {
    return <CreatorDetail username={creator} />
  }

  const shared = {
    as_of: asOf,
    from_date: fromDate,
    creators_pop: population === "claimed" ? ("claimed" as const) : undefined,
  }

  const setPopulation = (next: CreatorPopulation) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("section", "creators")
    params.delete("creator")
    params.delete("creators_source")
    params.delete("source")

    if (showDirectory) params.set("creators_view", "directory")
    else params.delete("creators_view")

    if (next === "organic") {
      params.delete("creators_pop")
      // Organic overview only has Growth; avoid treating metrics id as a username path.
      if (!showDirectory && metrics !== "growth") params.delete("creators_metrics")
    } else {
      params.set("creators_pop", "claimed")
    }

    router.replace(`/admin/dashboard?${params.toString()}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
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

        <div className="inline-flex shrink-0 rounded-lg border bg-muted p-0.5">
          {CREATOR_POPULATIONS.map((id) => (
            <button
              key={id}
              type="button"
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                population === id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setPopulation(id)}
            >
              {CREATOR_POPULATION_LABELS[id]}
            </button>
          ))}
        </div>
      </div>

      {showDirectory ? <CreatorsDirectory /> : <CreatorsOverview />}
    </div>
  )
}
