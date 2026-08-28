import { ArtistDirectoryGridSkeleton } from "@/components/artists/ArtistDirectoryGridSkeleton"

export default function ArtistIndexLoading() {
  return (
    <div className="space-y-8 sm:space-y-10" aria-busy aria-live="polite">
      <div className="space-y-4 sm:space-y-5">
        <div className="space-y-3">
          <div className="h-10 w-3/4 max-w-lg animate-shimmer rounded-lg bg-muted" />
          <div className="h-4 w-full max-w-2xl animate-shimmer rounded bg-muted/80" />
          <div className="h-4 w-5/6 max-w-xl animate-shimmer rounded bg-muted/70" />
        </div>
        <div className="h-14 animate-shimmer rounded-2xl border border-border/60 bg-muted/30" />
      </div>
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-48 animate-shimmer rounded bg-muted" />
          <div className="h-4 w-72 animate-shimmer rounded bg-muted/80" />
        </div>
        <ArtistDirectoryGridSkeleton />
      </div>
      <span className="sr-only">Loading Artist Index</span>
    </div>
  )
}
