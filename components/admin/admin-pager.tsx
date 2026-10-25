"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Previous / Next pager. Pass `total` when the full count is known (shows "x–y of n"),
 * otherwise `hasNext` from the API's has_more.
 */
export function AdminPager({
  page,
  pageSize,
  total,
  hasNext,
  loading,
  onPage,
}: {
  page: number
  pageSize: number
  total?: number
  hasNext?: boolean
  loading?: boolean
  onPage: (page: number) => void
}) {
  const pageCount = total != null ? Math.max(1, Math.ceil(total / pageSize)) : null
  const canNext = pageCount != null ? page < pageCount : Boolean(hasNext)
  if (page <= 1 && !canNext) return null

  const first = (page - 1) * pageSize + 1
  const label =
    total != null
      ? `${first.toLocaleString()}–${Math.min(page * pageSize, total).toLocaleString()} of ${total.toLocaleString()} · page ${page} of ${pageCount}`
      : `Page ${page}`

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm text-muted-foreground tabular-nums">{label}</p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => onPage(page - 1)}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Previous
        </Button>
        <Button variant="outline" size="sm" disabled={!canNext || loading} onClick={() => onPage(page + 1)}>
          Next
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

/** Page number that resets to 1 whenever `resetKey` changes (filters, search, selected item). */
export function usePageFor(resetKey: string): [number, (page: number) => void] {
  const [state, setState] = useState({ key: resetKey, page: 1 })
  const page = state.key === resetKey ? state.page : 1
  return [page, (next: number) => setState({ key: resetKey, page: Math.max(1, next) })]
}

/** Client-side slice for lists already loaded in full. */
export function pageSlice<T>(items: T[], page: number, pageSize: number): T[] {
  return items.slice((page - 1) * pageSize, page * pageSize)
}
