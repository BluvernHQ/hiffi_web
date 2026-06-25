"use client"

import { useEffect, useState } from "react"
import { ExternalLink, Globe } from "lucide-react"
import { cn } from "@/lib/utils"
import { getPublicSiteLabel } from "@/lib/admin/site-link"

interface AdminViewSiteLinkProps {
  isCollapsed?: boolean
  className?: string
}

export function AdminViewSiteLink({ isCollapsed = false, className }: AdminViewSiteLinkProps) {
  const [label, setLabel] = useState("View site")

  useEffect(() => {
    setLabel(getPublicSiteLabel())
  }, [])

  return (
    <a
      href="/"
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      className={cn(
        "group flex w-full items-center rounded-lg text-sm font-medium transition-colors",
        "text-primary hover:bg-primary/10 active:scale-[0.99]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isCollapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
        className,
      )}
    >
      <Globe className="h-[18px] w-[18px] flex-shrink-0" aria-hidden="true" />
      {!isCollapsed ? (
        <>
          <span className="min-w-0 flex-1 truncate">{label}</span>
          <ExternalLink
            className="h-3.5 w-3.5 flex-shrink-0 opacity-70 transition-opacity group-hover:opacity-100"
            aria-hidden="true"
          />
        </>
      ) : null}
    </a>
  )
}
