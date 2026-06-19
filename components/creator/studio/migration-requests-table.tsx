"use client"

import { useMemo } from "react"
import { format } from "date-fns"
import {
  MIGRATION_CONTENT_TYPE_LABELS,
  MIGRATION_STATUS_LABELS,
  type MigrationRequestStatus,
  type YoutubeMigrationRequest,
} from "@/lib/types/youtube-migration"
import { cn } from "@/lib/utils"
import { MIGRATION_REQUESTS_SECTION_ID } from "@/lib/youtube-migration-storage"

function statusBadgeClass(status: MigrationRequestStatus): string {
  if (status === "completed") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
  if (status === "rejected") return "bg-red-500/15 text-red-700 dark:text-red-400"
  if (status === "processing") return "bg-amber-500/15 text-amber-700 dark:text-amber-400"
  if (status === "submitted") return "bg-muted text-muted-foreground"
  return "bg-blue-500/15 text-blue-700 dark:text-blue-400"
}

function truncateUrl(url: string, max = 36): string {
  if (url.length <= max) return url
  return `${url.slice(0, max)}…`
}

type MigrationRequestsTableProps = {
  requests: YoutubeMigrationRequest[]
  sectionRef?: React.RefObject<HTMLElement | null>
}

export function MigrationRequestsTable({ requests, sectionRef }: MigrationRequestsTableProps) {
  const sorted = useMemo(
    () => [...requests].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
    [requests],
  )

  if (sorted.length === 0) return null

  return (
    <section
      id={MIGRATION_REQUESTS_SECTION_ID}
      ref={sectionRef}
      aria-labelledby="migration-requests-title"
      className="scroll-mt-6"
    >
      <h2
        id="migration-requests-title"
        className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground"
      >
        Migration requests
      </h2>

      <div className="mt-4 overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm sm:rounded-2xl">
        <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-border/80 bg-muted/30">
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:px-5">
                    Submitted date
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:px-5">
                    YouTube URL
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:px-5">
                    Content type
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:px-5">
                    Status
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:px-5">
                    Note
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((request) => (
                  <tr key={request.id} className="border-b border-border/60 last:border-0">
                    <td className="whitespace-nowrap px-4 py-3.5 text-[13px] text-foreground sm:px-5">
                      {format(new Date(request.submittedAt), "dd MMM yyyy")}
                    </td>
                    <td className="max-w-[200px] px-4 py-3.5 sm:px-5">
                      <a
                        href={request.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[13px] text-blue-600 hover:underline dark:text-blue-400"
                        title={request.youtubeUrl}
                      >
                        {truncateUrl(request.youtubeUrl.replace(/^https?:\/\//, ""))}
                      </a>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-[13px] text-muted-foreground sm:px-5">
                      {MIGRATION_CONTENT_TYPE_LABELS[request.contentType]}
                    </td>
                    <td className="px-4 py-3.5 sm:px-5">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize",
                          statusBadgeClass(request.status),
                        )}
                      >
                        {MIGRATION_STATUS_LABELS[request.status]}
                      </span>
                    </td>
                    <td className="max-w-[180px] px-4 py-3.5 text-[13px] text-muted-foreground sm:px-5">
                      {request.note?.trim() || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      </div>
    </section>
  )
}
