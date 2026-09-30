import { cn } from "@/lib/utils"

export const ARTIST_ROSTER_GRID =
  "grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 sm:gap-y-12 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6"

/** Roster tiles in waiting: same geometry as `ArtistRosterCard`, staggered sheen. */
export function ArtistRosterSkeleton({ count = 12, className }: { count?: number; className?: string }) {
  return (
    <div className={cn(ARTIST_ROSTER_GRID, className)} aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} style={{ animationDelay: `${(index % 6) * 90}ms` }}>
          <div className="paper-skeleton aspect-square rounded-[20px]" style={{ animationDelay: "inherit" }} />
          <div className="paper-skeleton mt-3.5 h-5 w-2/3 rounded-md" style={{ animationDelay: "inherit" }} />
          <div className="paper-skeleton mt-2 h-2.5 w-2/5 rounded-full" style={{ animationDelay: "inherit" }} />
        </div>
      ))}
    </div>
  )
}
