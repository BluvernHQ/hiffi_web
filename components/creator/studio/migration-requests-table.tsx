"use client"

import { useMemo } from "react"
import { format } from "date-fns"
import {
  MIGRATION_STATUS_LABELS,
  MIGRATION_PLATFORM_LABELS,
  type MigrationRequest,
} from "@/lib/types/youtube-migration"
import { cn } from "@/lib/utils"
import { MIGRATION_REQUESTS_SECTION_ID } from "@/lib/youtube-migration-storage"

function statusBadgeClass(status: MigrationRequest["status"]): string {
  if (status === "completed") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
  if (status === "rejected") return "bg-red-500/15 text-red-700 dark:text-red-400"
  if (status === "approved") return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
  if (status === "pending") return "bg-muted text-muted-foreground"
  return "bg-blue-500/15 text-blue-700 dark:text-blue-400"
}

function displayChannelUrl(url: string): string {
  return url.replace(/^https?:\/\//, "")
}

function extractContentType(note: string | null | undefined): string {
  if (!note?.trim()) return "—"
  const firstLine = note.split("\n")[0]?.trim() ?? ""
  if (firstLine.startsWith("Content type:")) {
    const label = firstLine.slice("Content type:".length).trim()
    return label || "—"
  }
  return "—"
}

function MigrationRequestCard({ request }: { request: MigrationRequest }) {
  const contentType = extractContentType(request.note)

  return (
    <article className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Reference</p>
          {request.reference_id ? (
            <p className="mt-0.5 break-all font-mono text-[12px] font-medium text-foreground">
              {request.reference_id}
            </p>
          ) : (
            <p className="mt-0.5 text-[13px] text-muted-foreground">—</p>
          )}
        </div>
        <span
          className={cn(
            "shrink-0 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize",
            statusBadgeClass(request.status),
          )}
        >
          {MIGRATION_STATUS_LABELS[request.status] ?? request.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Submitted</p>
          <p className="mt-0.5 text-[13px] text-foreground">
            {format(new Date(request.created_at), "dd MMM yyyy")}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Platform</p>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {MIGRATION_PLATFORM_LABELS[request.platform] ?? request.platform}
          </p>
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Channel URL</p>
        <a
          href={request.channel_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-0.5 block break-all text-[13px] text-blue-600 hover:underline dark:text-blue-400"
        >
          {displayChannelUrl(request.channel_url)}
        </a>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Content type</p>
        <p className="mt-0.5 text-[13px] text-muted-foreground">{contentType}</p>
      </div>
    </article>
  )
}

type MigrationRequestsTableProps = {
  requests: MigrationRequest[]
  sectionRef?: React.RefObject<HTMLElement | null>
}

export function MigrationRequestsTable({ requests, sectionRef }: MigrationRequestsTableProps) {
  const sorted = useMemo(
    () => [...requests].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [requests],
  )

  if (sorted.length === 0) return null

  return (
    <section
      id={MIGRATION_REQUESTS_SECTION_ID}
      ref={sectionRef}
      aria-labelledby="migration-requests-title"
      className="scroll-mt-6 min-w-0"
    >
      <h2
        id="migration-requests-title"
        className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground"
      >
        Migration requests
      </h2>

      <div className="mt-4 min-w-0 rounded-xl border border-border/80 bg-card shadow-sm sm:rounded-2xl">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[720px] table-fixed text-left text-sm">
            <thead>
              <tr className="border-b border-border/80 bg-muted/30">
                <th className="w-[18%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:px-5">
                  Reference
                </th>
                <th className="w-[12%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:px-5">
                  Submitted
                </th>
                <th className="w-[10%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:px-5">
                  Platform
                </th>
                <th className="w-[30%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:px-5">
                  Channel URL
                </th>
                <th className="w-[12%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:px-5">
                  Status
                </th>
                <th className="w-[18%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:px-5">
                  Content type
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((request) => {
                const contentType = extractContentType(request.note)
                return (
                <tr key={request.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3.5 sm:px-5">
                    {request.reference_id ? (
                      <span
                        className="block truncate font-mono text-[12px] font-medium text-foreground"
                        title={request.reference_id}
                      >
                        {request.reference_id}
                      </span>
                    ) : (
                      <span className="text-[13px] text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-[13px] text-foreground sm:px-5">
                    {format(new Date(request.created_at), "dd MMM yyyy")}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-[13px] text-muted-foreground sm:px-5">
                    {MIGRATION_PLATFORM_LABELS[request.platform] ?? request.platform}
                  </td>
                  <td className="px-4 py-3.5 sm:px-5">
                    <a
                      href={request.channel_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-[13px] text-blue-600 hover:underline dark:text-blue-400"
                      title={request.channel_url}
                    >
                      {displayChannelUrl(request.channel_url)}
                    </a>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 sm:px-5">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize",
                        statusBadgeClass(request.status),
                      )}
                    >
                      {MIGRATION_STATUS_LABELS[request.status] ?? request.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 sm:px-5">
                    <span
                      className="block truncate text-[13px] text-muted-foreground"
                      title={contentType !== "—" ? contentType : undefined}
                    >
                      {contentType}
                    </span>
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-border/60">
          {sorted.map((request) => (
            <MigrationRequestCard key={request.id} request={request} />
          ))}
        </div>
      </div>
    </section>
  )
}
