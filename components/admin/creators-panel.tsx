"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { CreatorsOverview } from "@/components/admin/creators-overview"
import { CreatorsDirectory } from "@/components/admin/creators-directory"
import { CreatorDetail } from "@/components/admin/creator-detail"
import { CreatorsRangePicker, type CreatorsRangeChange } from "@/components/admin/creators-range-picker"
import {
  creatorsDashboardHref,
  hasDirectoryQuery,
  parseCreatorsMetricsSection,
  parseCreatorsPopulation,
} from "@/lib/admin/creator-nav"
import {
  applyCreatorsRange,
  hasRangeParams,
  rangeLinkParams,
  resolveCreatorsRange,
  storedRangeQuery,
  storeRangeQuery,
} from "@/lib/admin/creators-range"
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
  const population = parseCreatorsPopulation(searchParams.get("creators_pop"))
  const metrics = parseCreatorsMetricsSection(searchParams.get("creators_metrics"))
  const range = resolveCreatorsRange(searchParams)
  const [rangeReady, setRangeReady] = useState(false)

  // Links into Creators (KPI cards, queues, sidebar) carry no dates: keep the range picked earlier.
  useEffect(() => {
    if (hasRangeParams(searchParams)) {
      storeRangeQuery(searchParams)
      setRangeReady(true)
      return
    }
    const stored = storedRangeQuery()
    if (stored) {
      const params = new URLSearchParams(searchParams.toString())
      new URLSearchParams(stored).forEach((value, key) => params.set(key, value))
      router.replace(`/admin/dashboard?${params.toString()}`)
      return
    }
    setRangeReady(true)
  }, [router, searchParams])

  if (creator) {
    return <CreatorDetail username={creator} />
  }

  const shared = {
    ...rangeLinkParams(searchParams),
    creators_pop: population === "claimed" ? ("claimed" as const) : undefined,
  }

  const setRange = (next: CreatorsRangeChange) => {
    const params = applyCreatorsRange(new URLSearchParams(searchParams.toString()), next)
    params.set("section", "creators")
    params.delete("page")
    storeRangeQuery(params)
    router.replace(`/admin/dashboard?${params.toString()}`)
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
        <div className="flex flex-wrap items-center gap-2">
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
          <CreatorsRangePicker value={range} onChange={setRange} />
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

      {!rangeReady ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : showDirectory ? (
        <CreatorsDirectory range={range} />
      ) : (
        <CreatorsOverview range={range} />
      )}
    </div>
  )
}
