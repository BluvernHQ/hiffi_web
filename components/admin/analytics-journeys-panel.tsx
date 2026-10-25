"use client"

import { useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AnalyticsFeaturesPanel } from "@/components/admin/analytics-features-panel"
import { AnalyticsJourneyFunnelsPanel } from "@/components/admin/analytics-journey-funnels-panel"
import { AnalyticsJourneyPathsPanel } from "@/components/admin/analytics-journey-paths-panel"
import { AnalyticsJourneySessionsPanel } from "@/components/admin/analytics-journey-sessions-panel"
import { cn } from "@/lib/utils"

type JourneysTab = "paths" | "features" | "funnels" | "sessions"

const TAB_QUERY = "journeys_tab"

const TABS: Array<{ id: JourneysTab; label: string }> = [
  { id: "paths", label: "All journeys" },
  { id: "features", label: "Features" },
  { id: "funnels", label: "Funnels" },
  { id: "sessions", label: "Sessions" },
]

/**
 * Journeys admin shell:
 * - All journeys (default): every distinct path through the app and who took it
 * - Features: adoption of each tracked control
 * - Funnels: chain enter → exit drop-off + matched groups
 * - Sessions: raw visitor timeline drill-down
 */
export function AnalyticsJourneysPanel() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const activeTab = useMemo((): JourneysTab => {
    const raw = searchParams.get(TAB_QUERY)
    if (raw === "sessions" || raw === "funnels" || raw === "features") return raw
    // Deep-link with sessionId should land on the timeline inspector.
    if (searchParams.get("sessionId")) return "sessions"
    return "paths"
  }, [searchParams])

  const setTab = (tab: JourneysTab) => {
    const next = new URLSearchParams(searchParams.toString())
    next.set("section", "journeys")
    next.delete("sessionId")
    if (tab === "paths") next.delete(TAB_QUERY)
    else next.set(TAB_QUERY, tab)
    router.replace(`/admin/dashboard?${next.toString()}`, { scroll: false })
  }

  const openSession = (sessionId: string) => {
    const next = new URLSearchParams(searchParams.toString())
    next.set("section", "journeys")
    next.set(TAB_QUERY, "sessions")
    next.set("sessionId", sessionId)
    router.replace(`/admin/dashboard?${next.toString()}`, { scroll: false })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTab(tab.id)}
            className={cn(
              "rounded-t-md px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "bg-primary/10 text-foreground border-b-2 border-primary -mb-px"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "paths" ? <AnalyticsJourneyPathsPanel onOpenSession={openSession} /> : null}
      {activeTab === "features" ? <AnalyticsFeaturesPanel onOpenSession={openSession} /> : null}
      {activeTab === "funnels" ? <AnalyticsJourneyFunnelsPanel onOpenSession={openSession} /> : null}
      {activeTab === "sessions" ? <AnalyticsJourneySessionsPanel /> : null}
    </div>
  )
}
