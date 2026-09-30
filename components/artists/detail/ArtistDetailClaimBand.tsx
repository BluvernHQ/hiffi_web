import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { Artist } from "@/lib/artists"
import { artistClaimState } from "@/components/artists/detail/artist-detail-data"

const CLAIM_BENEFITS = [
  { title: "Your exact rank", detail: "Global and city rank, weekly movement, and what moves it." },
  { title: "Paid opportunities", detail: "Brand sponsorships, paid collaborations and partner offers." },
  { title: "Your story, your way", detail: "Photos, bio, links and videos, written by you." },
]

/** Closing band: claim for unclaimed/pending pages, brand & booking for verified ones. */
export function ArtistDetailClaimBand({ artist }: { artist: Artist }) {
  const claimState = artistClaimState(artist)
  const claimHref = `/artist-index/${artist.slug}/claim`

  if (claimState === "verified") {
    return (
      <section className="flex flex-col gap-5 border-y border-[#0B0B0C]/12 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#77726A] sm:text-[11px]">
            Brands &amp; booking
          </p>
          <p className="font-signal mt-2 text-3xl font-bold uppercase leading-none text-[#0B0B0C] sm:text-4xl">
            Work with {artist.name}
          </p>
        </div>
        <Link
          href="/collaborate"
          className="group inline-flex items-center gap-2 self-start rounded-full bg-[#0B0B0C] px-5 py-3 text-sm font-semibold text-[#F4F1EA] transition-colors hover:bg-black sm:self-auto"
        >
          Start a collaboration
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </section>
    )
  }

  return (
    <section className="relative isolate overflow-hidden rounded-[28px] bg-[#0B0B0C] px-6 py-10 text-[#F4F1EA] sm:px-10 sm:py-14">
      <div
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_100%_0%,rgba(232,25,44,0.28),transparent_55%)]"
        aria-hidden
      />
      <div className="mood-grain pointer-events-none absolute inset-0 -z-10 opacity-[0.06] mix-blend-overlay" aria-hidden />

      <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45 sm:text-[11px]">For {artist.name}</p>
      <h2 className="font-signal mt-3 max-w-3xl text-[clamp(2.25rem,5.5vw,4.5rem)] font-bold uppercase leading-[0.88]">
        {claimState === "pending" ? "Ownership is being verified." : "Your page is already here. Make it yours."}
      </h2>

      {claimState === "pending" ? (
        <p className="mt-5 max-w-xl text-[15px] leading-7 text-white/65">
          Someone has asked to own this page and the Hiffi team is reviewing it. If you’re the rightful owner, you
          can still request ownership.
        </p>
      ) : (
        <ul className="mt-9 grid gap-6 border-t border-white/10 pt-7 sm:grid-cols-3 sm:gap-8">
          {CLAIM_BENEFITS.map((benefit, index) => (
            <li key={benefit.title}>
              <p className="font-mono text-[10px] tracking-[0.28em] text-[#FF6B78]">0{index + 1}</p>
              <p className="mt-2 text-base font-semibold">{benefit.title}</p>
              <p className="mt-1 text-sm leading-6 text-white/55">{benefit.detail}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
        <Link
          href={claimHref}
          className="group inline-flex items-center gap-2 rounded-full bg-[#E8192C] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#d01528]"
        >
          {claimState === "pending" ? "Request ownership" : "Claim this profile"}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
        {claimState === "unclaimed" ? (
          <p className="text-sm text-white/45">About 2 minutes, then a quick review by the Hiffi team.</p>
        ) : null}
      </div>
    </section>
  )
}
