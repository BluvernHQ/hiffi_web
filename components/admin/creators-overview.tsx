"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
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
  parseCreatorsMetricsSection,
  parseCreatorsPopulation,
} from "@/lib/admin/creator-nav"
import {
  comparePeriodFor,
  formatRangeDates,
  rangeLinkParams,
  staleDaysFor,
  toCreatorDateRange,
  type ResolvedCreatorsRange,
} from "@/lib/admin/creators-range"
import {
  CREATOR_METRICS_SECTION_LABELS,
  metricsSectionsForPopulation,
} from "@/lib/types/admin-creators"
import { cn } from "@/lib/utils"

export function CreatorsOverview({ range: resolved }: { range: ResolvedCreatorsRange }) {
  const searchParams = useSearchParams()
  const metrics = parseCreatorsMetricsSection(searchParams.get("creators_metrics"))
  const population = parseCreatorsPopulation(searchParams.get("creators_pop"))
  const availableSections = metricsSectionsForPopulation(population)
  const activeMetrics = availableSections.includes(metrics) ? metrics : "growth"
  const range = toCreatorDateRange(resolved)
  const staleDays = staleDaysFor(resolved)

  return (
    <div className="space-y-6 pb-8">
      <p className="text-sm text-muted-foreground max-w-xl">
        {resolved.label} · {formatRangeDates(resolved)} (UTC). Organic and Claimed stay separate.
        {population === "organic"
          ? " Extended tabs (Acquisition–Cohorts) are on Claimed."
          : " Click KPI numbers to open the matching list."}
      </p>

      <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {availableSections.map((section) => (
          <Link
            key={section}
            href={creatorsDashboardHref({
              view: "dashboard",
              ...rangeLinkParams(searchParams),
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
        <GrowthMetricsSection
          population={population}
          range={range}
          staleDays={staleDays}
          compare={comparePeriodFor(resolved)}
          rangeDays={resolved.days}
        />
      ) : null}
      {activeMetrics === "acquisition" ? (
        <AcquisitionSection population={population} range={range} />
      ) : null}
      {activeMetrics === "activation" ? (
        <ActivationSection population={population} range={range} />
      ) : null}
      {activeMetrics === "engagement" ? (
        <EngagementSection population={population} range={range} staleDays={staleDays} />
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
