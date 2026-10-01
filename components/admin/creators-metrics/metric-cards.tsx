"use client"

import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCount, formatRate } from "@/lib/admin/creator-nav"
import { cn } from "@/lib/utils"

export function KpiCard({
  href,
  label,
  value,
  hint,
  icon: Icon,
  warn,
  rate,
}: {
  href: string
  label: string
  value: number
  hint?: string
  icon?: LucideIcon
  warn?: boolean
  rate?: number | null
}) {
  return (
    <Link href={href} className="group">
      <Card
        className={cn(
          "border-2 h-full transition-all duration-200 hover:shadow-lg hover:border-primary/30",
          warn && "border-amber-200 bg-amber-50/40",
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground">{label}</CardTitle>
          {Icon ? (
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20">
              <Icon className="h-4 w-4 text-primary" />
            </div>
          ) : null}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight tabular-nums">{formatCount(value)}</div>
          {hint || rate != null ? (
            <p className="text-[11px] text-muted-foreground mt-1">
              {rate != null ? formatRate(rate) : null}
              {rate != null && hint ? " · " : null}
              {hint}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  )
}

export function MetricStatGrid({
  items,
}: {
  items: Array<{ label: string; value: string; hint?: string }>
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card key={item.label} className="border-2">
          <CardContent className="py-4">
            <p className="text-xs font-semibold text-muted-foreground">{item.label}</p>
            <p className="text-2xl font-bold mt-1 tabular-nums">{item.value}</p>
            {item.hint ? (
              <p className="text-[11px] text-muted-foreground mt-1">{item.hint}</p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function MetricsLoading({ label = "Loading metrics…" }: { label?: string }) {
  return (
    <div className="rounded-xl border-2 border-dashed p-10 text-center text-sm text-muted-foreground">
      {label}
    </div>
  )
}

export function MetricsEmpty({ label = "Unable to load metrics." }: { label?: string }) {
  return <p className="text-sm text-muted-foreground py-12 text-center">{label}</p>
}
