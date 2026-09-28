import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ARTIST_INDEX_CLAIM_PATH } from "@/lib/artist-directory"

const STEPS = [
  { title: "Find your page", detail: "Search your artist name. Most artists are already indexed." },
  { title: "Claim it", detail: "About 2 minutes, then a quick review by the Hiffi team." },
  { title: "See your rank", detail: "Your exact position, what moves it, and paid opportunities." },
]

export function ArtistIndexClaimBand() {
  return (
    <section className="relative isolate overflow-hidden rounded-[28px] bg-[#0B0B0C] px-6 py-10 text-[#F4F1EA] sm:px-10 sm:py-14">
      <div
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_100%_0%,rgba(232,25,44,0.28),transparent_55%)]"
        aria-hidden
      />
      <div className="mood-grain pointer-events-none absolute inset-0 -z-10 opacity-[0.06] mix-blend-overlay" aria-hidden />

      <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45 sm:text-[11px]">For artists</p>
      <h2 className="font-signal mt-3 max-w-3xl text-[clamp(2.25rem,5.5vw,4.5rem)] font-bold uppercase leading-[0.88]">
        You’re probably already here. Make it official.
      </h2>

      <ol className="mt-9 grid gap-6 border-t border-white/10 pt-7 sm:grid-cols-3 sm:gap-8">
        {STEPS.map((step, index) => (
          <li key={step.title}>
            <p className="font-mono text-[10px] tracking-[0.28em] text-[#FF6B78]">0{index + 1}</p>
            <p className="mt-2 text-base font-semibold">{step.title}</p>
            <p className="mt-1 text-sm leading-6 text-white/55">{step.detail}</p>
          </li>
        ))}
      </ol>

      <Link
        href={ARTIST_INDEX_CLAIM_PATH}
        className="group mt-9 inline-flex items-center gap-2 rounded-full bg-[#E8192C] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#d01528]"
      >
        Claim your profile
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </Link>
    </section>
  )
}
