import { ArtistDirectoryShell } from "@/components/artists/ArtistDirectoryShell"

export default function ArtistIndexLoading() {
  return (
    <ArtistDirectoryShell claimLabel="Claim Now" bleed>
      <div aria-busy aria-live="polite">
        <section className="relative isolate overflow-hidden bg-[#0B0B0C]">
          <div
            className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_10%_0%,rgba(232,25,44,0.2),transparent_50%)]"
            aria-hidden
          />
          <div className="mx-auto max-w-6xl animate-pulse px-4 pb-14 pt-16 sm:px-6 lg:px-8 lg:pt-20" aria-hidden>
            <div className="h-3 w-40 rounded-full bg-white/10" />
            <div className="mt-6 h-14 w-full max-w-lg rounded-xl bg-white/[0.08] sm:h-20" />
            <div className="mt-3 h-14 w-3/4 max-w-md rounded-xl bg-white/[0.05] sm:h-20" />
            <div className="mt-8 h-14 w-full max-w-xl rounded-full bg-white/[0.06]" />
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8" aria-hidden>
          <div className="h-3 w-28 rounded-full bg-[#0B0B0C]/10" />
          <div className="mt-4 h-10 w-72 rounded-lg bg-[#0B0B0C]/[0.07]" />
          <div className="mt-10 grid animate-pulse grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 sm:gap-x-6">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index}>
                <div className="aspect-square rounded-[20px] bg-[#0B0B0C]/[0.07]" />
                <div className="mt-3.5 h-5 w-2/3 rounded bg-[#0B0B0C]/[0.08]" />
                <div className="mt-2 h-2.5 w-1/3 rounded bg-[#0B0B0C]/[0.06]" />
              </div>
            ))}
          </div>
        </div>

        <span className="sr-only">Loading Artist Index</span>
      </div>
    </ArtistDirectoryShell>
  )
}
