"use client"

import { useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { YoutubeApiKeysPanel } from "@/components/admin/youtube-api-keys-panel"
import { cn } from "@/lib/utils"

export type ToolsTab = "youtube_api_keys"

const TAB_QUERY = "tools_tab"

const TOOL_TABS: Array<{ id: ToolsTab; label: string; description: string }> = [
  {
    id: "youtube_api_keys",
    label: "YouTube API Keys",
    description: "Manage the YouTube Data API v3 key pool for artist ranking",
  },
]

export function AdminToolsPanel() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const activeTab = useMemo((): ToolsTab => {
    const raw = searchParams.get(TAB_QUERY)
    if (raw && TOOL_TABS.some((tab) => tab.id === raw)) return raw as ToolsTab
    return "youtube_api_keys"
  }, [searchParams])

  const setTab = (tab: ToolsTab) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("section", "tools")
    if (tab === "youtube_api_keys") params.delete(TAB_QUERY)
    else params.set(TAB_QUERY, tab)
    router.replace(`/admin/dashboard?${params.toString()}`)
  }

  const activeMeta = TOOL_TABS.find((tab) => tab.id === activeTab) ?? TOOL_TABS[0]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b pb-1">
        {TOOL_TABS.map((tab) => (
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

      {activeMeta ? (
        <p className="text-sm text-muted-foreground -mt-2">{activeMeta.description}</p>
      ) : null}

      {activeTab === "youtube_api_keys" ? <YoutubeApiKeysPanel /> : null}
    </div>
  )
}
