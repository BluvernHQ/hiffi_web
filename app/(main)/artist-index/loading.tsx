import { ArtistDirectoryShell } from "@/components/artists/ArtistDirectoryShell"
import { artistPageContainer } from "@/components/artists/artist-layout"
import { ArtistRosterSkeleton } from "@/components/artists/index/ArtistRosterSkeleton"
import { cn } from "@/lib/utils"

export default function ArtistIndexLoading() {
  return (
    <ArtistDirectoryShell claimHref={null} bleed>
      <div aria-busy aria-live="polite">
        <section className="relative isolate overflow-hidden bg-[#0B0B0C]">
          <div
            className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_10%_0%,rgba(232,25,44,0.2),transparent_50%)]"
            aria-hidden
          />
          <div
            className={cn(
              artistPageContainer,
              "grid gap-10 pb-14 pt-12 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-end lg:gap-16 lg:pt-20 2xl:grid-cols-[minmax(0,1fr)_460px] 2xl:gap-24",
            )}
            aria-hidden
          >
            <div>
              <div className="ink-skeleton h-3 w-36 rounded-full" />
              <div className="ink-skeleton mt-6 h-14 w-full max-w-2xl rounded-xl sm:h-24" />
              <div className="ink-skeleton mt-3 h-14 w-3/4 max-w-xl rounded-xl sm:h-24" />
              <div className="ink-skeleton mt-8 h-4 w-full max-w-lg rounded-full" />
              <div className="ink-skeleton mt-8 h-14 w-full max-w-2xl rounded-full" />
            </div>
            <div className="hidden lg:block">
              <div className="ink-skeleton mb-3 h-3 w-28 rounded-full" />
              <div className="grid grid-cols-3 gap-2.5">
                {Array.from({ length: 6 }, (_, index) => (
                  <div key={index} className="ink-skeleton aspect-[4/5] rounded-2xl" />
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className={cn(artistPageContainer, "pb-20 pt-14 sm:pt-20")} aria-hidden>
          <div className="paper-skeleton h-3 w-28 rounded-full" />
          <div className="paper-skeleton mt-4 h-10 w-72 max-w-full rounded-lg sm:h-12" />
          <ArtistRosterSkeleton className="mt-10" />
        </div>

        <span className="sr-only">Loading Artist Index</span>
      </div>
    </ArtistDirectoryShell>
  )
}
