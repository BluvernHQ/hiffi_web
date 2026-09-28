import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ArtistDetailEyebrow, ArtistDetailHeading } from "@/components/artists/detail/ArtistDetailSection"

const WEIGHTS = [
  { share: "35%", title: "Recent momentum", body: "30-day view and subscriber growth." },
  { share: "30%", title: "View velocity", body: "Views earned relative to audience size." },
  { share: "20%", title: "Audience reach", body: "Verified channel subscriber footprint." },
  { share: "15%", title: "Consistency", body: "Sustained publishing and performance." },
]

export function TopChartMethod() {
  return (
    <section aria-labelledby="top-chart-method" className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)] lg:gap-20">
      <div>
        <ArtistDetailEyebrow>Method</ArtistDetailEyebrow>
        <ArtistDetailHeading id="top-chart-method">Built on signal, not opinion</ArtistDetailHeading>
        <p className="mt-5 max-w-md text-[15px] leading-7 text-[#3B3833]">
          The score blends YouTube and Instagram data to capture both established scale and current momentum.
          Every input is normalized across the tracked artists, then re-run each week.
        </p>
        <Link
          href="/top-artists/how-it-works"
          className="group mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B0B0C]"
        >
          How the ranking works
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </div>

      <ol className="grid border-t border-[#0B0B0C]/12 sm:grid-cols-2">
        {WEIGHTS.map((weight, index) => (
          <li
            key={weight.title}
            className="flex items-start gap-5 border-b border-[#0B0B0C]/12 py-6 sm:odd:pr-8 sm:even:border-l sm:even:pl-8"
          >
            <span className="font-signal w-24 shrink-0 text-[3.25rem] font-bold leading-[0.85] tabular-nums text-[#0B0B0C]">
              {weight.share}
            </span>
            <span className="min-w-0 pt-1">
              <span className="font-mono text-[10px] tabular-nums text-[#0B0B0C]/35">{String(index + 1).padStart(2, "0")}</span>
              <span className="mt-1 block text-base font-semibold text-[#0B0B0C]">{weight.title}</span>
              <span className="mt-1 block text-sm leading-6 text-[#77726A]">{weight.body}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
