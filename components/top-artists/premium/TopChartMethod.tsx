import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ArtistDetailEyebrow, ArtistDetailHeading } from "@/components/artists/detail/ArtistDetailSection"

export const CHART_WEIGHTS = [
  { share: 35, title: "Recent momentum", body: "View and subscriber growth across the 7, 30 and 90-day windows." },
  { share: 30, title: "View velocity", body: "Views earned relative to audience size." },
  { share: 20, title: "Audience reach", body: "Verified channel subscriber footprint." },
  { share: 15, title: "Consistency", body: "Sustained publishing and performance." },
]

export function ChartWeightList() {
  return (
    <ol className="grid border-t border-white/10 sm:grid-cols-2">
      {CHART_WEIGHTS.map((weight, index) => (
        <li
          key={weight.title}
          className="flex items-start gap-5 border-b border-white/10 py-6 sm:odd:pr-8 sm:even:border-l sm:even:border-l-white/10 sm:even:pl-8"
        >
          <span className="font-signal w-24 shrink-0 text-[3.25rem] font-bold leading-[0.85] tabular-nums text-[#F4F1EA]">
            {weight.share}%
          </span>
          <span className="min-w-0 pt-1">
            <span className="font-mono text-[10px] tabular-nums text-white/30">{String(index + 1).padStart(2, "0")}</span>
            <span className="mt-1 block text-base font-semibold text-[#F4F1EA]">{weight.title}</span>
            <span className="mt-1 block text-sm leading-6 text-white/50">{weight.body}</span>
          </span>
        </li>
      ))}
    </ol>
  )
}

export function TopChartMethod() {
  return (
    <section aria-labelledby="top-chart-method" className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)] lg:gap-20">
      <div>
        <ArtistDetailEyebrow className="text-white/45">Method</ArtistDetailEyebrow>
        <ArtistDetailHeading id="top-chart-method" className="text-[#F4F1EA]">
          Built on signal, not opinion
        </ArtistDetailHeading>
        <p className="mt-5 max-w-md text-[15px] leading-7 text-white/65">
          The score blends YouTube and Instagram data to capture both established scale and current momentum.
          Every input is normalized across the tracked artists, then re-run each week.
        </p>
        <Link
          href="/top-artists/how-it-works"
          className="group mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#F4F1EA] hover:text-white"
        >
          How the ranking works
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </div>

      <ChartWeightList />
    </section>
  )
}
