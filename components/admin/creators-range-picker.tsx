"use client"

import { useEffect, useState } from "react"
import { CalendarDays, Check, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { utcDateString } from "@/lib/admin/creator-nav"
import {
  CREATOR_RANGE_PRESETS,
  formatRangeDates,
  type CreatorRangePresetId,
  type ResolvedCreatorsRange,
} from "@/lib/admin/creators-range"
import { cn } from "@/lib/utils"

export type CreatorsRangeChange = { preset: CreatorRangePresetId } | { from_date?: string; to_date: string }

/** Shared date range for Admin > Creators: rolling presets or a custom from–to range. */
export function CreatorsRangePicker({
  value,
  onChange,
}: {
  value: ResolvedCreatorsRange
  onChange: (next: CreatorsRangeChange) => void
}) {
  const today = utcDateString()
  const [open, setOpen] = useState(false)
  const [from, setFrom] = useState(value.from_date ?? "")
  const [to, setTo] = useState(value.to_date)

  useEffect(() => {
    if (!open) return
    setFrom(value.from_date ?? "")
    setTo(value.to_date)
  }, [open, value.from_date, value.to_date])

  const customValid = Boolean(to) && (!from || from <= to)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-10 gap-2 rounded-xl px-3 text-sm font-medium">
          <CalendarDays className="h-4 w-4 text-primary" />
          <span>{value.label}</span>
          <span className="hidden text-xs font-normal text-muted-foreground sm:inline">{formatRangeDates(value)}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(92vw,30rem)] p-0">
        <div className="grid sm:grid-cols-[11rem_1fr]">
          <div className="border-b p-2 sm:border-b-0 sm:border-r">
            {CREATOR_RANGE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  onChange({ preset: preset.id })
                  setOpen(false)
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-muted",
                  value.preset === preset.id && "bg-muted font-semibold",
                )}
              >
                {preset.label}
                {value.preset === preset.id ? <Check className="h-4 w-4 text-primary" /> : null}
              </button>
            ))}
          </div>
          <div className="space-y-3 p-4">
            <p className="text-sm font-semibold">Custom range</p>
            <label className="block text-xs text-muted-foreground">
              From
              <input
                type="date"
                max={to || today}
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-sm text-foreground"
              />
            </label>
            <label className="block text-xs text-muted-foreground">
              To
              <input
                type="date"
                min={from || undefined}
                max={today}
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-sm text-foreground"
              />
            </label>
            <p className="text-[11px] text-muted-foreground">
              Leave From empty for everything up to the To date. Dates are UTC.
            </p>
            <Button
              size="sm"
              className="w-full"
              disabled={!customValid}
              onClick={() => {
                onChange({ from_date: from || undefined, to_date: to > today ? today : to })
                setOpen(false)
              }}
            >
              Apply range
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
