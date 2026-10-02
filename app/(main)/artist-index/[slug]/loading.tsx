import { ArtistDirectoryShell } from "@/components/artists/ArtistDirectoryShell"
import { artistPageContainer } from "@/components/artists/artist-layout"
import { cn } from "@/lib/utils"

export default function ArtistDetailLoading() {
  return (
    <ArtistDirectoryShell claimHref={null} bleed>
      <div aria-busy aria-live="polite">
        <section className="relative isolate overflow-hidden bg-[#0B0B0C]">
          <div
            className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_15%_0%,rgba(232,25,44,0.22),transparent_55%)]"
            aria-hidden
          />
          <div className={artistPageContainer} aria-hidden>
            <div className="flex items-center justify-between gap-4 pt-5 sm:pt-6">
              <div className="ink-skeleton h-4 w-28 rounded-full" />
              <div className="flex gap-2">
                <div className="ink-skeleton h-9 w-9 rounded-full" />
                <div className="ink-skeleton h-9 w-9 rounded-full" />
              </div>
            </div>

            <div className="grid items-end gap-7 pb-10 pt-8 sm:pb-12 md:grid-cols-[auto_minmax(0,1fr)] md:gap-12 lg:pt-14">
              <div className="ink-skeleton aspect-[4/5] w-36 rounded-[22px] sm:w-48 sm:rounded-[28px] md:w-60 lg:w-72" />
              <div className="min-w-0">
                <div className="ink-skeleton h-3 w-44 rounded-full" />
                <div className="ink-skeleton mt-5 h-14 w-full max-w-xl rounded-xl sm:h-20 lg:h-24" />
                <div className="ink-skeleton mt-6 h-4 w-full max-w-md rounded-full" />
                <div className="mt-8 flex flex-wrap gap-3">
                  <div className="ink-skeleton h-12 w-44 rounded-full" />
                  <div className="ink-skeleton h-12 w-36 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={cn(artistPageContainer, "space-y-20 pb-20 pt-12 sm:space-y-24 sm:pt-16")} aria-hidden>
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-20">
            <div>
              <div className="paper-skeleton h-3 w-24 rounded-full" />
              <div className="paper-skeleton mt-4 h-9 w-64 max-w-full rounded-lg" />
              <div className="mt-6 space-y-3">
                <div className="paper-skeleton h-4 w-full rounded-full" />
                <div className="paper-skeleton h-4 w-11/12 rounded-full" />
                <div className="paper-skeleton h-4 w-4/5 rounded-full" />
                <div className="paper-skeleton h-4 w-2/3 rounded-full" />
              </div>
            </div>
            <div>
              <div className="paper-skeleton h-3 w-20 rounded-full" />
              <div className="mt-5 space-y-3">
                {Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="paper-skeleton h-14 w-full rounded-2xl" />
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="paper-skeleton h-3 w-28 rounded-full" />
            <div className="paper-skeleton mt-4 h-9 w-72 max-w-full rounded-lg" />
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="paper-skeleton aspect-[4/5] rounded-2xl" />
              ))}
            </div>
          </div>
        </div>

        <span className="sr-only">Loading artist profile</span>
      </div>
    </ArtistDirectoryShell>
  )
}
