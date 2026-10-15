import { cn } from "@/lib/utils"

type ArtistDirectoryGridSkeletonProps = {
  count?: number
  compact?: boolean
}

export function ArtistDirectoryGridSkeleton({
  count = 9,
  compact = false,
}: ArtistDirectoryGridSkeletonProps) {
  return (
    <div
      className={cn(
        "grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3 xl:gap-6",
        "animate-pulse",
      )}
      aria-hidden
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-2xl border border-border/60 bg-muted/30"
        >
          <div className="h-28 bg-muted/50 sm:h-32" />
          <div className="space-y-3 p-4 sm:p-5">
            <div className="mx-auto h-16 w-16 -mt-12 rounded-full bg-muted" />
            <div className="mx-auto h-4 w-2/3 rounded bg-muted" />
            <div className="mx-auto h-3 w-1/2 rounded bg-muted/80" />
            <div className="flex justify-center gap-2 pt-2">
              <div className="h-8 w-20 rounded-full bg-muted" />
              <div className="h-8 w-20 rounded-full bg-muted/80" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
