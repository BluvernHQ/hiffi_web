import Link from "next/link"
import type { AtlantaRankedEntry } from "@/lib/atlanta/types"
import { cn } from "@/lib/utils"

type AtlantaRankedListProps = {
  entries: AtlantaRankedEntry[]
  className?: string
}

export function AtlantaRankedList({ entries, className }: AtlantaRankedListProps) {
  if (entries.length === 0) return null

  return (
    <ol className={cn("space-y-3", className)}>
      {entries.map((entry) => (
        <li
          key={`${entry.rank}-${entry.title}`}
          className="flex gap-4 rounded-xl border border-border/70 bg-card/50 p-4 sm:p-5"
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
            aria-hidden
          >
            {entry.rank}
          </span>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              {entry.watchId ? (
                <Link
                  href={`/watch/${entry.watchId}`}
                  className="font-semibold text-foreground hover:text-primary"
                >
                  {entry.title}
                </Link>
              ) : (
                <span className="font-semibold text-foreground">{entry.title}</span>
              )}
              {entry.subtitle ? (
                entry.artistSlug ? (
                  <Link
                    href={`/artist-index/${entry.artistSlug}`}
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    {entry.subtitle}
                  </Link>
                ) : (
                  <span className="text-sm text-muted-foreground">{entry.subtitle}</span>
                )
              ) : null}
            </div>
            {entry.blurb ? (
              <p className="text-sm leading-relaxed text-muted-foreground">{entry.blurb}</p>
            ) : null}
            {entry.artistSlug && !entry.subtitle ? (
              <p className="pt-1">
                <Link
                  href={`/artist-index/${entry.artistSlug}`}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  View artist profile
                </Link>
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  )
}
