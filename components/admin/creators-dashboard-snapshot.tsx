"use client"

import { useEffect, useState, type MouseEvent } from "react"
import Link from "next/link"
import { ArrowRight, Info, Loader2, Users } from "lucide-react"
import { adminApiClient } from "@/lib/admin-api-client"
import { useAdminNetworkError } from "@/hooks/use-admin-network-error"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  creatorsDashboardHref,
  formatCount,
  formatDays,
  formatRate,
  kpiDirectoryParams,
} from "@/lib/admin/creator-nav"
import type { CreatorOverview, CreatorPopulation } from "@/lib/types/admin-creators"

const ACTIVE_7D_INFO =
  "Creators with at least one login, session, or upload in the last 7 days (based on last activity)."
const ACTIVE_30D_INFO =
  "Creators with at least one login, session, or upload in the last 30 days (based on last activity)."

type SnapshotBlock = {
  population: CreatorPopulation
  title: string
  overview: CreatorOverview
}

function PopulationSnapshot({ population, title, overview }: SnapshotBlock) {
  const uploadPct = Math.min(100, Math.max(0, overview.upload_rate))
  const newThisWeek =
    population === "claimed"
      ? (overview.new_claims_this_week ?? overview.new_creators_this_week)
      : overview.new_creators_this_week

  const cards: Array<{
    href: string
    label: string
    value: string
    warn?: boolean
    info?: string
  }> = [
    {
      href: creatorsDashboardHref(kpiDirectoryParams("total", population)),
      label: population === "claimed" ? "Claimed" : "Creators",
      value: formatCount(overview.total_creators),
    },
    {
      href: creatorsDashboardHref(kpiDirectoryParams("uploads", population)),
      label: "Have uploaded",
      value: formatCount(overview.creators_with_uploads),
    },
    {
      href: creatorsDashboardHref(kpiDirectoryParams("never", population)),
      label: "Never uploaded",
      value: formatCount(overview.never_uploaded),
      warn: overview.never_uploaded > 0,
    },
    {
      href: creatorsDashboardHref(kpiDirectoryParams("active_7d", population)),
      label: "Active 7d",
      value: formatCount(overview.active_7d),
      info: ACTIVE_7D_INFO,
    },
    {
      href: creatorsDashboardHref(kpiDirectoryParams("active_30d", population)),
      label: "Active 30d",
      value: formatCount(overview.active_30d),
      info: ACTIVE_30D_INFO,
    },
    {
      href: creatorsDashboardHref(kpiDirectoryParams("new", population)),
      label: population === "claimed" ? "New claims" : "New this week",
      value: formatCount(newThisWeek),
    },
  ]

  const stopInfoClick = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatRate(overview.upload_rate)} have uploaded · median{" "}
            {formatDays(overview.median_days_to_first_upload)} to first video
          </p>
        </div>
        <Link
          href={creatorsDashboardHref({
            creators_pop: population === "claimed" ? "claimed" : undefined,
          })}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline shrink-0"
        >
          Open {title.toLowerCase()}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>Upload conversion</span>
          <span>{formatRate(overview.upload_rate)}</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-primary" style={{ width: `${uploadPct}%` }} />
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {cards.map((card) => (
          <Link
            key={`${population}-${card.label}`}
            href={card.href}
            className={`rounded-xl border p-3 hover:border-primary/40 hover:shadow-sm transition-all ${
              card.warn ? "border-amber-200 bg-amber-50/50" : ""
            }`}
          >
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <span>{card.label}</span>
              {card.info ? (
                <button
                  type="button"
                  title={card.info}
                  aria-label={card.info}
                  onClick={stopInfoClick}
                  className="inline-flex rounded-full text-muted-foreground/80 hover:text-foreground"
                >
                  <Info className="h-3 w-3" />
                </button>
              ) : null}
            </p>
            <p className="text-xl font-semibold mt-1 tabular-nums">{card.value}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function CreatorsDashboardSnapshot() {
  const { guardOfflineBeforeFetch, handleFetchError } = useAdminNetworkError()
  const [organic, setOrganic] = useState<CreatorOverview | null>(null)
  const [claimed, setClaimed] = useState<CreatorOverview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (guardOfflineBeforeFetch()) {
        setLoading(false)
        return
      }
      try {
        const [organicData, claimedData] = await Promise.all([
          adminApiClient.adminGetCreatorOverview(undefined, "organic"),
          adminApiClient.adminGetCreatorOverview(undefined, "claimed").catch(() => null),
        ])
        if (!cancelled) {
          setOrganic(organicData)
          setClaimed(claimedData)
        }
      } catch (error) {
        if (!cancelled) {
          setOrganic(null)
          setClaimed(null)
          handleFetchError(error)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [guardOfflineBeforeFetch, handleFetchError])

  if (loading) {
    return (
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Creators
          </CardTitle>
          <CardDescription>Creator health</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading creator metrics…
        </CardContent>
      </Card>
    )
  }

  if (!organic && !claimed) return null

  return (
    <Card className="border-2">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Creators
          </CardTitle>
          <CardDescription className="mt-1">
            Organic self-serve and inventory claimed artists — kept separate
          </CardDescription>
        </div>
        <Link
          href={creatorsDashboardHref()}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline shrink-0"
        >
          Open dashboard
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-6">
        {organic ? (
          <PopulationSnapshot population="organic" title="Organic" overview={organic} />
        ) : null}
        {organic && claimed ? <div className="border-t" /> : null}
        {claimed ? (
          <PopulationSnapshot population="claimed" title="Claimed" overview={claimed} />
        ) : null}
      </CardContent>
    </Card>
  )
}
