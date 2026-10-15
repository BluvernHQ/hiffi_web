"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { GrowthMetricsSection } from "@/components/admin/creators-metrics/growth-section"
import { AcquisitionSection } from "@/components/admin/creators-metrics/acquisition-section"
import { ActivationSection } from "@/components/admin/creators-metrics/activation-section"
import { EngagementSection } from "@/components/admin/creators-metrics/engagement-section"
import { RetentionSection } from "@/components/admin/creators-metrics/retention-section"
import { ContentSection } from "@/components/admin/creators-metrics/content-section"
import { QualitySection } from "@/components/admin/creators-metrics/quality-section"
import { OpsSection } from "@/components/admin/creators-metrics/ops-section"
import { CohortsSection } from "@/components/admin/creators-metrics/cohorts-section"
import {
  creatorsDashboardHref,
  normalizeAsOf,
  parseCreatorsMetricsSection,
  parseCreatorsPopulation,
  utcDateString,
} from "@/lib/admin/creator-nav"
import {
  CREATOR_METRICS_SECTION_LABELS,
  metricsSectionsForPopulation,
  type CreatorDateRange,
  type CreatorMetricsSection,
  type CreatorPopulation,
} from "@/lib/types/admin-creators"
import { cn } from "@/lib/utils"

export function CreatorsOverview() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const asOf = normalizeAsOf(searchParams.get("as_of"))
  const fromDateRaw = searchParams.get("from_date")
  const from_date =
    fromDateRaw && /^\d{4}-\d{2}-\d{2}$/.test(fromDateRaw) && fromDateRaw <= asOf
      ? fromDateRaw
      : undefined
  const todayUtc = utcDateString()
  const metrics = parseCreatorsMetricsSection(searchParams.get("creators_metrics"))
  const population = parseCreatorsPopulation(searchParams.get("creators_pop"))
  const availableSections = metricsSectionsForPopulation(population)
  const activeMetrics = availableSections.includes(metrics) ? metrics : "growth"

  const range: CreatorDateRange = {
    to_date: asOf,
    ...(from_date ? { from_date } : {}),
  }

  const patchParams = (patch: {
    as_of?: string | null
    from_date?: string | null
    creators_metrics?: CreatorMetricsSection | null
    creators_pop?: CreatorPopulation | null
  }) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("section", "creators")
    params.delete("creators_view")
    params.delete("creator")
    params.delete("creators_source")

    if (patch.as_of !== undefined) {
      if (!patch.as_of || patch.as_of === todayUtc) params.delete("as_of")
      else params.set("as_of", patch.as_of)
    }
    if (patch.from_date !== undefined) {
      if (!patch.from_date) params.delete("from_date")
      else params.set("from_date", patch.from_date)
    }
    if (patch.creators_metrics !== undefined) {
      if (!patch.creators_metrics || patch.creators_metrics === "growth") {
        params.delete("creators_metrics")
      } else {
        params.set("creators_metrics", patch.creators_metrics)
      }
    }
    if (patch.creators_pop !== undefined) {
      if (!patch.creators_pop || patch.creators_pop === "organic") {
        params.delete("creators_pop")
      } else {
        params.set("creators_pop", patch.creators_pop)
      }
    }

    router.replace(`/admin/dashboard?${params.toString()}`)
  }

  return (
    <div className="space-y-6 pb-8">
      <p className="text-sm text-muted-foreground max-w-xl">
        Metrics as of {asOf} UTC
        {from_date ? ` · range from ${from_date}` : ""}. Organic and Claimed stay separate.
        {population === "organic"
          ? " Extended tabs (Acquisition–Cohorts) are on Claimed."
          : " Click KPI numbers to open the matching list."}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex flex-wrap items-center gap-2 rounded-xl border bg-background px-2.5 py-1.5">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium shrink-0">From</span>
            <input
              type="date"
              max={asOf}
              value={from_date ?? ""}
              onChange={(e) => {
                const value = e.target.value
                if (!value) {
                  patchParams({ from_date: null })
                  return
                }
                const next = normalizeAsOf(value)
                patchParams({ from_date: next <= asOf ? next : asOf })
              }}
              className="h-8 w-[9.5rem] rounded-md border bg-background px-2 text-sm text-foreground"
              aria-label="Range start date (optional)"
            />
          </label>
          {from_date ? (
            <button
              type="button"
              onClick={() => patchParams({ from_date: null })}
              className="h-7 rounded-md px-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Clear start date"
            >
              Clear
            </button>
          ) : (
            <span className="hidden sm:inline text-[11px] text-muted-foreground/80">optional</span>
          )}
          <span className="text-muted-foreground/40 px-0.5" aria-hidden>
            →
          </span>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium shrink-0">As of</span>
            <input
              type="date"
              max={todayUtc}
              value={asOf}
              onChange={(e) => {
                const nextAsOf = normalizeAsOf(e.target.value)
                const patch: { as_of: string; from_date?: string | null } = { as_of: nextAsOf }
                if (from_date && from_date > nextAsOf) patch.from_date = null
                patchParams(patch)
              }}
              className="h-8 w-[9.5rem] rounded-md border bg-background px-2 text-sm text-foreground"
              aria-label="As of date"
            />
          </label>
          {asOf !== todayUtc ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={() => patchParams({ as_of: todayUtc })}
            >
              Today
            </Button>
          ) : null}
        </div>
      </div>

      <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {availableSections.map((section) => (
          <Link
            key={section}
            href={creatorsDashboardHref({
              view: "dashboard",
              as_of: asOf !== todayUtc ? asOf : undefined,
              from_date,
              creators_metrics: section,
              creators_pop: population === "claimed" ? "claimed" : undefined,
            })}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              activeMetrics === section
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:text-foreground",
            )}
          >
            {CREATOR_METRICS_SECTION_LABELS[section]}
          </Link>
        ))}
      </div>

      {activeMetrics === "growth" ? (
        <GrowthMetricsSection population={population} range={range} />
      ) : null}
      {activeMetrics === "acquisition" ? (
        <AcquisitionSection population={population} range={range} />
      ) : null}
      {activeMetrics === "activation" ? (
        <ActivationSection population={population} range={range} />
      ) : null}
      {activeMetrics === "engagement" ? (
        <EngagementSection population={population} range={range} />
      ) : null}
      {activeMetrics === "retention" ? (
        <RetentionSection population={population} range={range} />
      ) : null}
      {activeMetrics === "content" ? (
        <ContentSection population={population} range={range} />
      ) : null}
      {activeMetrics === "quality" ? (
        <QualitySection population={population} range={range} />
      ) : null}
      {activeMetrics === "ops" ? <OpsSection population={population} range={range} /> : null}
      {activeMetrics === "cohorts" ? (
        <CohortsSection population={population} range={range} />
      ) : null}
    </div>
  )
}
