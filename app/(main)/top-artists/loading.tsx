import { ArtistDirectoryShell } from "@/components/artists/ArtistDirectoryShell"
import { artistPageContainer } from "@/components/artists/artist-layout"
import { cn } from "@/lib/utils"

export default function TopArtistsLoading() {
  return (
    <ArtistDirectoryShell claimHref={null} bleed tone="ink">
      <div aria-busy aria-live="polite">
        <section className="relative isolate overflow-hidden border-b border-white/10 bg-[#0B0B0C]">
          <div
            className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_10%_0%,rgba(232,25,44,0.2),transparent_50%)]"
            aria-hidden
          />
          <div
            className={cn(
              artistPageContainer,
              "grid gap-12 pb-14 pt-12 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,500px)] lg:items-end lg:gap-14 lg:pb-20 lg:pt-20 2xl:grid-cols-[minmax(0,1fr)_600px] 2xl:gap-24",
            )}
            aria-hidden
          >
            <div>
              <div className="ink-skeleton h-3 w-44 rounded-full" />
              <div className="ink-skeleton mt-6 h-14 w-full max-w-2xl rounded-xl sm:h-24" />
              <div className="ink-skeleton mt-3 h-14 w-3/4 max-w-xl rounded-xl sm:h-24" />
              <div className="ink-skeleton mt-8 h-4 w-full max-w-lg rounded-full" />
              <div className="ink-skeleton mt-8 h-12 w-44 rounded-full" />
            </div>
            <div className="grid grid-cols-[1fr_1.18fr_1fr] items-end gap-3">
              <div className="ink-skeleton aspect-[3/4] rounded-[22px]" />
              <div className="ink-skeleton mb-8 aspect-[3/4] rounded-[22px]" />
              <div className="ink-skeleton aspect-[3/4] rounded-[22px]" />
            </div>
          </div>
        </section>

        <div className={cn(artistPageContainer, "pb-20 pt-12 sm:pt-20")} aria-hidden>
          <div className="ink-skeleton h-3 w-28 rounded-full" />
          <div className="ink-skeleton mt-4 h-10 w-80 max-w-full rounded-lg sm:h-12" />
          <div className="mt-8 flex gap-2">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="ink-skeleton h-9 w-28 rounded-full" />
            ))}
          </div>
          <div className="mt-10 divide-y divide-white/[0.07]">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="flex items-center gap-4 py-4">
                <div className="ink-skeleton h-7 w-9 rounded" />
                <div className="ink-skeleton h-12 w-12 rounded-xl" />
                <div className="flex-1">
                  <div className="ink-skeleton h-4 w-1/3 rounded-full" />
                  <div className="ink-skeleton mt-2 h-2.5 w-1/5 rounded-full" />
                </div>
                <div className="ink-skeleton h-5 w-12 rounded-full" />
              </div>
            ))}
          </div>
        </div>
        <span className="sr-only">Loading the Hip-Hop 500</span>
      </div>
    </ArtistDirectoryShell>
  )
}
