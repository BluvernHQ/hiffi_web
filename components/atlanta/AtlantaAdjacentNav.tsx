import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import type { AtlantaAdjacent } from "@/lib/atlanta/types"
import { cn } from "@/lib/utils"

type AtlantaAdjacentNavProps = {
  adjacent: AtlantaAdjacent
  className?: string
  label?: string
}

export function AtlantaAdjacentNav({
  adjacent,
  className,
  label = "Adjacent pages",
}: AtlantaAdjacentNavProps) {
  const { prev, next } = adjacent
  if (!prev && !next) return null

  return (
    <nav
      aria-label={label}
      className={cn(
        "grid gap-3 border-t border-border/70 pt-6 sm:grid-cols-2",
        className,
      )}
    >
      {prev ? (
        <Link
          href={prev.href}
          className="group flex flex-col rounded-xl border border-border/70 bg-card/50 p-4 transition-colors hover:border-primary/40"
        >
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" aria-hidden />
            Previous
          </span>
          <span className="mt-1 text-sm font-semibold text-foreground group-hover:text-primary">
            {prev.title}
          </span>
        </Link>
      ) : (
        <div className="hidden sm:block" aria-hidden />
      )}
      {next ? (
        <Link
          href={next.href}
          className="group flex flex-col rounded-xl border border-border/70 bg-card/50 p-4 text-right transition-colors hover:border-primary/40 sm:items-end"
        >
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Next
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </span>
          <span className="mt-1 text-sm font-semibold text-foreground group-hover:text-primary">
            {next.title}
          </span>
        </Link>
      ) : null}
    </nav>
  )
}
