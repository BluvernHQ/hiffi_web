import Link from "next/link"
import { INDEX_CHART_SIZES, type ChartSize } from "@/lib/chart-size"
import { cn } from "@/lib/utils"

type ArtistIndexChartSizeProps = {
  value: ChartSize
  hrefFor: (size: ChartSize) => string
  tone?: "light" | "dark"
  className?: string
}

/** Switches the weekly chart between 1,000, 5,000, and 10,000. */
export function ArtistIndexChartSize({ value, hrefFor, tone = "light", className }: ArtistIndexChartSizeProps) {
  const dark = tone === "dark"
  return (
    <div role="group" aria-label="Chart size" className={cn("flex flex-wrap gap-1.5", className)}>
      {INDEX_CHART_SIZES.map((size) => {
        const selected = size === value
        return (
          <Link
            key={size}
            href={hrefFor(size)}
            aria-current={selected ? "true" : undefined}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold tabular-nums transition-colors",
              selected
                ? dark
                  ? "bg-[#F4F1EA] text-[#0B0B0C]"
                  : "bg-[#0B0B0C] text-[#F4F1EA]"
                : dark
                  ? "border border-white/15 text-white/70 hover:border-white/40 hover:text-white"
                  : "border border-[#0B0B0C]/15 text-[#3B3833] hover:border-[#0B0B0C]/40 hover:text-[#0B0B0C]",
            )}
          >
            {size.toLocaleString()}
          </Link>
        )
      })}
    </div>
  )
}
