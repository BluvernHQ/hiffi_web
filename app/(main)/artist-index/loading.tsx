import { ArtistDirectoryShell } from "@/components/artists/ArtistDirectoryShell"
import { ArtistDirectoryGridSkeleton } from "@/components/artists/ArtistDirectoryGridSkeleton"
import { ArtistIndexIntro } from "@/components/artists/ArtistIndexIntro"

export default function ArtistIndexLoading() {
  return (
    <ArtistDirectoryShell claimLabel="Claim Now">
      <div className="space-y-8 sm:space-y-10" aria-busy aria-live="polite">
        <div className="space-y-4 sm:space-y-5">
          <ArtistIndexIntro artistCount={0} variant="hub" />
          <section
            aria-label="Search artists"
            className="rounded-2xl border border-[#E8192C]/15 bg-[#FAFAFA] p-3 shadow-sm sm:p-4"
          >
            <div className="h-11 rounded-xl border border-border/60 bg-white" aria-hidden />
          </section>
        </div>

        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Featured artists
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Verified and emerging hip-hop and rap artists across cities — search profiles and
              explore official links.
            </p>
          </div>
          <ArtistDirectoryGridSkeleton />
        </section>

        <span className="sr-only">Loading Artist Index</span>
      </div>
    </ArtistDirectoryShell>
  )
}
