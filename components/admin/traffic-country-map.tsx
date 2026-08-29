"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import WorldMap, { type ISOCode } from "react-svg-worldmap"
import type { BreakdownItem } from "@/lib/api/admin-traffic"
import {
  MAP_COLORS,
  breakdownToCountryMapData,
  countryMapFill,
  countryMapTooltip,
  formatMapMetricValue,
  metricLabel,
  topCountriesByMetric,
  type TrafficMapMetric,
} from "@/lib/admin/traffic-country-geo"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const METRICS: TrafficMapMetric[] = ["requests", "pageViews", "visits", "bandwidth"]

type TrafficCountryMapProps = {
  items: BreakdownItem[]
  className?: string
}

export function TrafficCountryMap({ items, className }: TrafficCountryMapProps) {
  const [metric, setMetric] = useState<TrafficMapMetric>("requests")
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [mapWidth, setMapWidth] = useState(720)

  useEffect(() => {
    const element = mapContainerRef.current
    if (!element) return

    const updateWidth = () => {
      const next = Math.floor(element.getBoundingClientRect().width)
      if (next > 0) setMapWidth(Math.max(320, next))
    }

    updateWidth()
    const observer = new ResizeObserver(updateWidth)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const mapPoints = useMemo(() => breakdownToCountryMapData(items, metric), [items, metric])

  const itemByCountry = useMemo(() => {
    const lookup = new Map<string, BreakdownItem>()
    for (const point of mapPoints) {
      lookup.set(point.country.toUpperCase(), point.item)
    }
    return lookup
  }, [mapPoints])

  const mapData = useMemo(
    () =>
      mapPoints.map(({ country, value }) => ({
        country: country as ISOCode,
        value,
      })),
    [mapPoints],
  )

  const topCountries = useMemo(
    () => topCountriesByMetric(items, metric, 8),
    [items, metric],
  )

  const topValue = topCountries[0]?.value ?? 1
  const unmappedCount = items.length - mapPoints.length

  return (
    <Card className={cn("border shadow-sm overflow-hidden", className)} data-testid="traffic-country-map">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="text-base">Traffic by country</CardTitle>
            <CardDescription>
              Geographic distribution by {metricLabel(metric).toLowerCase()}. Hover a country for details.
            </CardDescription>
          </div>
          <div
            className="inline-flex flex-wrap rounded-lg border bg-muted/40 p-1 shrink-0"
            role="group"
            aria-label="Map metric"
          >
            {METRICS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMetric(value)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  metric === value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-pressed={metric === value}
              >
                {metricLabel(value)}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {mapData.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No mappable country data for this range.
          </p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start">
            <div
              ref={mapContainerRef}
              className="rounded-xl border p-3 sm:p-5 w-full min-w-0"
              style={{ backgroundColor: MAP_COLORS.background, borderColor: MAP_COLORS.border }}
            >
              <div className="flex w-full justify-center overflow-hidden">
                <WorldMap
                  data={mapData}
                  size={mapWidth}
                  color={MAP_COLORS.highlight}
                  backgroundColor="transparent"
                  borderColor={MAP_COLORS.border}
                  strokeOpacity={1}
                  richInteraction
                  frame={false}
                  containerClassName="w-full"
                  tooltipBgColor="#18181b"
                  tooltipTextColor="#fafafa"
                  styleFunction={(ctx) => {
                    const hasValue = ctx.countryValue != null && ctx.maxValue > 0
                    return {
                      fill: hasValue
                        ? countryMapFill(Number(ctx.countryValue) / ctx.maxValue)
                        : MAP_COLORS.empty,
                      stroke: MAP_COLORS.border,
                      strokeWidth: 0.4,
                      outline: "none",
                      cursor: hasValue ? "pointer" : "default",
                    }
                  }}
                  tooltipTextFunction={(ctx) =>
                    countryMapTooltip(
                      ctx.countryName,
                      itemByCountry.get(String(ctx.countryCode).toUpperCase()),
                    )
                  }
                />
              </div>
              <div className="mt-4 flex items-center justify-center gap-3 text-[11px] text-muted-foreground">
                <span>Less</span>
                <div
                  className="h-2 w-36 rounded-full"
                  style={{
                    background: `linear-gradient(to right, ${MAP_COLORS.highlightLight}, ${MAP_COLORS.highlight})`,
                  }}
                />
                <span>More</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Top countries
              </p>
              <ul className="space-y-2">
                {topCountries.map((row) => {
                  const pct = topValue > 0 ? Math.max(4, (row.value / topValue) * 100) : 0
                  return (
                    <li key={row.key} className="space-y-1">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-medium truncate">{row.key}</span>
                        <span className="tabular-nums text-muted-foreground shrink-0">
                          {formatMapMetricValue(metric, row.value)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: MAP_COLORS.highlight,
                          }}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        )}
        {unmappedCount > 0 ? (
          <p className="text-xs text-muted-foreground text-center">
            {unmappedCount} row{unmappedCount === 1 ? "" : "s"} omitted from the map (unknown country code).
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
