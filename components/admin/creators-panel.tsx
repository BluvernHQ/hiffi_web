"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { CreatorsOverview } from "@/components/admin/creators-overview"
import { CreatorsDirectory } from "@/components/admin/creators-directory"
import { CreatorDetail } from "@/components/admin/creator-detail"
import { creatorsDashboardHref, hasDirectoryQuery } from "@/lib/admin/creator-nav"
import { cn } from "@/lib/utils"

export function CreatorsPanel() {
  const searchParams = useSearchParams()
  const creator = searchParams.get("creator")?.trim()
  const showDirectory = hasDirectoryQuery(searchParams)

  if (creator) {
    return <CreatorDetail username={creator} />
  }

  return (
    <div className="space-y-4">
      <div className="bg-muted text-muted-foreground inline-flex h-10 items-center rounded-xl p-1">
        <Link
          href={creatorsDashboardHref({ view: "dashboard" })}
          className={cn(
            "inline-flex h-8 items-center rounded-lg px-4 text-sm font-medium transition-colors",
            !showDirectory && "bg-background text-foreground shadow-sm",
          )}
        >
          Overview
        </Link>
        <Link
          href={creatorsDashboardHref({ view: "directory" })}
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
