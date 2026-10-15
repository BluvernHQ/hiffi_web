"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { adminApiClient } from "@/lib/admin-api-client"
import type { BreakdownDimension, TrafficBreakdownData, TrafficSeriesData } from "@/lib/api/admin-traffic"
import {
  TRAFFIC_POLL_INTERVAL_MS,
  breakdownErrorForDimension,
  classifyTrafficError,
  parseTrafficRange,
  type TrafficErrorKind,
} from "@/lib/admin/traffic-utils"
import { useAdminNetworkError } from "@/hooks/use-admin-network-error"
import { AdminOfflineState } from "@/components/admin/admin-offline-state"
import { TrafficAnalyticsView } from "@/components/admin/traffic-analytics-view"

const DEFAULT_BREAKDOWN_LIMIT = 10
const MAX_BREAKDOWN_LIMIT = 50

export function TrafficAnalyticsPanel() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const range = parseTrafficRange(searchParams.get("range"))

  const [breakdownDimension, setBreakdownDimension] = useState<BreakdownDimension>("country")
  const [breakdownLimit, setBreakdownLimit] = useState(DEFAULT_BREAKDOWN_LIMIT)

  const [series, setSeries] = useState<TrafficSeriesData | null>(null)
  const [seriesLoading, setSeriesLoading] = useState(true)
  const [seriesError, setSeriesError] = useState<TrafficErrorKind | null>(null)
  const [seriesErrorMessage, setSeriesErrorMessage] = useState<string | null>(null)

  const [breakdown, setBreakdown] = useState<TrafficBreakdownData | null>(null)
  const [breakdownLoading, setBreakdownLoading] = useState(true)
  const [breakdownError, setBreakdownError] = useState<TrafficErrorKind | null>(null)
  const [breakdownErrorMessage, setBreakdownErrorMessage] = useState<string | null>(null)

  const { networkError, clearNetworkError, guardOfflineBeforeFetch, handleFetchError } = useAdminNetworkError()

  const setRange = useCallback(
    (next: typeof range) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("section", "traffic")
      params.set("range", next)
      router.replace(`/admin/dashboard?${params.toString()}`, { scroll: false })
    },
    [router, searchParams],
  )

  const loadSeries = useCallback(async () => {
    if (guardOfflineBeforeFetch()) {
      setSeries(null)
      setSeriesLoading(false)
      return
    }
    try {
      setSeriesLoading(true)
      clearNetworkError()
      setSeriesError(null)
      setSeriesErrorMessage(null)
      const data = await adminApiClient.adminGetTraffic(range)
      setSeries(data)
    } catch (error) {
      const classified = classifyTrafficError(error)
      if (classified.kind === "unauthorized") {
        setSeries(null)
        return
      }
      if (handleFetchError(error)) {
        setSeries(null)
        return
      }
      setSeries(null)
      setSeriesError(classified.kind)
      setSeriesErrorMessage(classified.message)
    } finally {
      setSeriesLoading(false)
    }
  }, [clearNetworkError, guardOfflineBeforeFetch, handleFetchError, range])

  const loadBreakdown = useCallback(async () => {
    if (guardOfflineBeforeFetch()) {
      setBreakdown(null)
      setBreakdownLoading(false)
      return
    }
    try {
      setBreakdownLoading(true)
      setBreakdown(null)
      clearNetworkError()
      setBreakdownError(null)
      setBreakdownErrorMessage(null)
      const data = await adminApiClient.adminGetTrafficBreakdown(
        breakdownDimension,
        range,
        breakdownLimit,
      )
      setBreakdown(data)
    } catch (error) {
      const classified = breakdownErrorForDimension(
        breakdownDimension,
        classifyTrafficError(error),
      )
      if (classified.kind === "unauthorized") {
        setBreakdown(null)
        return
      }
      if (handleFetchError(error)) {
        setBreakdown(null)
        return
      }
      setBreakdown(null)
      setBreakdownError(classified.kind)
      setBreakdownErrorMessage(classified.message)
    } finally {
      setBreakdownLoading(false)
    }
  }, [
    breakdownDimension,
    breakdownLimit,
    clearNetworkError,
    guardOfflineBeforeFetch,
    handleFetchError,
    range,
  ])

  useEffect(() => {
    void loadSeries()
  }, [loadSeries])

  useEffect(() => {
    void loadBreakdown()
  }, [loadBreakdown])

  useEffect(() => {
    const id = window.setInterval(() => {
      void loadSeries()
      void loadBreakdown()
    }, TRAFFIC_POLL_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [loadBreakdown, loadSeries])

  useEffect(() => {
    setBreakdownLimit(breakdownDimension === "country" ? MAX_BREAKDOWN_LIMIT : DEFAULT_BREAKDOWN_LIMIT)
  }, [breakdownDimension, range])

  if (networkError && !series && !breakdown && !seriesLoading && !breakdownLoading) {
    return (
      <AdminOfflineState
        message={networkError}
        onRetry={() => {
          clearNetworkError()
          void loadSeries()
          void loadBreakdown()
        }}
      />
    )
  }

  return (
    <TrafficAnalyticsView
      range={range}
      onRangeChange={setRange}
      series={series}
      seriesLoading={seriesLoading}
      seriesError={seriesError}
      seriesErrorMessage={seriesErrorMessage}
      onSeriesRetry={() => void loadSeries()}
      breakdown={breakdown}
      breakdownLoading={breakdownLoading}
      breakdownError={breakdownError}
      breakdownErrorMessage={breakdownErrorMessage}
      breakdownDimension={breakdownDimension}
      onBreakdownDimensionChange={setBreakdownDimension}
      breakdownLimit={breakdownLimit}
      onBreakdownShowMore={() => setBreakdownLimit(MAX_BREAKDOWN_LIMIT)}
      onBreakdownRetry={() => void loadBreakdown()}
    />
  )
}
