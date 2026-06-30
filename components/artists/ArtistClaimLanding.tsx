import Image from "next/image"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ArtistClaimSearch } from "@/components/artists/ArtistClaimSearch"
import {
  ARTIST_CLAIM_FEATURES,
  ARTIST_CLAIM_STEPS,
} from "@/lib/artist-index/claim-landing-seo"
import { artistButtonSolid } from "@/components/artists/artist-styles"
import { cn } from "@/lib/utils"

const stepIconPaths = {
  "step-find": "/artist-claim/icons/step-find.svg",
  "step-verify": "/artist-claim/icons/step-verify.svg",
  "step-control": "/artist-claim/icons/step-control.svg",
} as const

type ArtistClaimLandingProps = {
  artistCount: number
}

export function ArtistClaimLanding({ artistCount }: ArtistClaimLandingProps) {
  const countLabel = artistCount > 0 ? artistCount.toLocaleString() : "800"

  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <Link
          href="/artist-index"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to Artist Index
        </Link>
        <div className="mt-6 grid items-start gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#E8192C]/20 bg-[#E8192C]/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#E8192C]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#E8192C]" aria-hidden />
              Artist Central
            </p>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
              Is this your profile?{" "}
              <span className="text-[#E8192C]">Claim it now.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Take ownership of your listing today. Verify your identity to update your discography,
              track fan analytics, and connect with the Hiffi community.
            </p>
            <div id="find-profile" className="mt-8 max-w-xl scroll-mt-24">
              <ArtistClaimSearch variant="claim" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Indexing {countLabel}+ artists in Atlanta today.
            </p>
          </div>

          <div className="mx-auto w-full max-w-[460px] lg:mx-0 lg:max-w-none">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="flex min-w-0 flex-[0.9] flex-col gap-3">
                <div className="w-full min-w-[248px] rounded-2xl border border-border bg-white px-3.5 py-3 shadow-sm sm:min-w-[272px]">
                  <div className="flex items-start gap-3">
                    <Image
                      src="/artist-claim/hero-profile.png"
                      alt="Jaxson Kaine profile"
                      width={48}
                      height={48}
                      className="h-12 w-12 shrink-0 rounded-full object-cover"
                    />
                    <div className="min-w-0 pt-0.5">
                      <p className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#E8192C]">
                        Verified
                        <Image
                          src="/artist-claim/icons/verified-badge.svg"
                          alt=""
                          width={10}
                          height={10}
                          className="h-2.5 w-2.5"
                          aria-hidden
                        />
                      </p>
                      <p className="mt-0.5 text-lg font-bold leading-tight text-foreground sm:text-xl">
                        Jaxson Kaine
                      </p>
                    </div>
                  </div>
                </div>

                <div className="w-full rounded-2xl bg-[#1B1C1C] px-3.5 py-3 text-white shadow-sm">
                  <Image
                    src="/artist-claim/icons/stats-chart.svg"
                    alt=""
                    width={33}
                    height={26}
                    className="h-6 w-auto"
                    aria-hidden
                  />
                  <p className="mt-2 text-2xl font-bold leading-none sm:text-3xl">2.4M</p>
                  <p className="mt-1 text-sm text-white/70">Monthly Listeners</p>
                </div>
              </div>

              <div className="relative aspect-[4/5] min-h-[240px] flex-[1.1] shrink-0 self-start overflow-hidden rounded-2xl shadow-lg sm:min-h-[272px]">
                <Image
                  src="/artist-claim/hero-live-stats.png"
                  alt="Artist performing on stage with live engagement stats"
                  width={560}
                  height={640}
                  className="absolute inset-0 h-full w-full object-cover"
                  priority
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent px-4 pb-4 pt-20">
                  <p className="text-lg font-bold text-white">Live Stats</p>
                  <p className="text-sm text-white/75">Real-time engagement</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="claim-steps-heading" className="bg-[#F8F8F8]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="text-center">
            <h2
              id="claim-steps-heading"
              className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
            >
              How it works
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground">
              Three simple steps to professional artist management.
            </p>
          </div>

          <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-6 lg:gap-10">
            {ARTIST_CLAIM_STEPS.map((item) => (
              <li key={item.step} className="min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#ECECEC]">
                    <Image
                      src={stepIconPaths[item.icon]}
                      alt=""
                      width={28}
                      height={28}
                      className="h-7 w-7"
                      aria-hidden
                    />
                  </div>
                  <span
                    className="select-none text-[4.5rem] font-bold leading-none tracking-tight text-black/[0.07] sm:text-[5.25rem]"
                    aria-hidden
                  >
                    {item.step}
                  </span>
                </div>
                <h3 className="mt-6 text-lg font-bold text-foreground sm:text-xl">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Features */}
      <section aria-labelledby="claim-features-heading" className="bg-[#1B1C1C] text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <h2
                id="claim-features-heading"
                className="max-w-lg text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-tight"
              >
                Everything you need to thrive in the industry.
              </h2>
              <ul className="mt-12 space-y-8">
                {ARTIST_CLAIM_FEATURES.map((feature) => (
                  <li key={feature.title} className="flex items-start gap-4">
                    <Image
                      src="/artist-claim/icons/check-feature.svg"
                      alt=""
                      width={20}
                      height={20}
                      className="mt-1 h-5 w-5 shrink-0"
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="text-base font-bold sm:text-lg">{feature.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-white/60">
                        {feature.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative mx-auto w-full max-w-lg lg:mx-0 lg:max-w-none">
              <Image
                src="/artist-claim/dashboard.png"
                alt="Hiffi artist analytics dashboard on a desktop monitor"
                width={720}
                height={540}
                className="h-auto w-full"
              />
              <div
                className={cn(
                  artistButtonSolid,
                  "absolute -bottom-3 left-0 flex min-w-[148px] flex-col items-center justify-center gap-0 rounded-2xl px-6 py-4 text-center normal-case shadow-xl sm:-bottom-4 sm:left-2",
                )}
              >
                <span className="text-3xl font-black leading-none tracking-tight">FREE</span>
                <span className="mt-1.5 text-[10px] font-semibold uppercase leading-tight tracking-[0.16em]">
                  Verified Artist Badge
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
