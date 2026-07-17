import Image from "next/image"
import { BadgeCheck } from "lucide-react"
import { ArtistClaimBackLink } from "@/components/artists/ArtistClaimBackLink"
import { ArtistClaimSearch } from "@/components/artists/ArtistClaimSearch"
import {
  ARTIST_CLAIM_FEATURES,
  ARTIST_CLAIM_STEPS,
} from "@/lib/artist-index/claim-landing-seo"

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
        <ArtistClaimBackLink />
        <div className="mt-6 grid items-center gap-10 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:gap-14">
          <div className="min-w-0">
            <span className="inline-flex h-[26px] items-center gap-1.5 rounded-full bg-[#E8192C] pl-2 pr-3 text-[10px] font-bold uppercase leading-none tracking-[0.18em] text-white">
              <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-white" strokeWidth={2.25} aria-hidden />
              Artist Central
            </span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
              Is this your profile?{" "}
              <span className="text-[#E8192C]">Claim it now.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Take ownership of your digital stage. Verified HIFFI artists can manage their
              discography, track real-time analytics, and build direct connections with their
              fanbase.
            </p>
            <div id="find-profile" className="mt-8 max-w-xl scroll-mt-24">
              <ArtistClaimSearch variant="claim" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Indexing {countLabel}+ artists in Atlanta today.
            </p>
          </div>

          <div className="w-full lg:max-w-[34rem] lg:justify-self-end">
            <div className="grid min-h-[18.75rem] grid-cols-1 gap-3 sm:min-h-[20rem] sm:grid-cols-[minmax(0,12.75rem)_minmax(0,1fr)] sm:items-stretch sm:gap-5 lg:min-h-[21.5rem] lg:grid-cols-[minmax(0,13.75rem)_minmax(0,1fr)] lg:gap-6">
              <div className="flex min-w-0 flex-col gap-3 self-start sm:gap-3.5">
                <div className="shrink-0 rounded-2xl border border-black/[0.06] bg-white p-3.5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] sm:p-4">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <Image
                      src="/artist-claim/hero-profile.png"
                      alt="Jaxson Kaine profile"
                      width={52}
                      height={52}
                      className="h-11 w-11 shrink-0 rounded-full object-cover sm:h-[52px] sm:w-[52px]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[#E8192C] sm:text-[10px]">
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
                      <p className="mt-0.5 text-sm font-bold leading-snug text-foreground sm:mt-1 sm:text-base">
                        Jaxson Kaine
                      </p>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 rounded-2xl bg-[#1B1C1C] px-3.5 py-3 text-white shadow-sm">
                  <Image
                    src="/artist-claim/icons/stats-chart.svg"
                    alt=""
                    width={33}
                    height={26}
                    className="h-6 w-auto"
                    aria-hidden
                  />
                  <p className="mt-2 text-2xl font-bold leading-none tracking-tight sm:text-[1.75rem]">
                    2.4M
                  </p>
                  <p className="mt-1 text-sm text-white/70">Monthly Listeners</p>
                </div>
              </div>

              <div className="relative min-h-[15rem] overflow-hidden rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.18)] sm:min-h-0 sm:h-full">
                <Image
                  src="/artist-claim/hero-live-stats.png"
                  alt="Artist performing on stage with live engagement stats"
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 42vw, 320px"
                  className="object-cover object-center"
                  priority
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent px-4 pb-4 pt-16">
                  <p className="text-lg font-bold leading-tight text-white">Live Stats</p>
                  <p className="mt-0.5 text-sm text-white/75">Real-time engagement</p>
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
          <div className="grid items-center gap-10 sm:gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:gap-10 xl:gap-14">
            <div className="min-w-0">
              <h2
                id="claim-features-heading"
                className="max-w-md text-3xl font-bold tracking-tight sm:text-4xl lg:max-w-lg lg:text-[2.75rem] lg:leading-tight"
              >
                Everything you need to thrive in the industry.
              </h2>
              <ul className="mt-10 space-y-7 sm:mt-12 sm:space-y-8">
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
                      <p className="mt-1 text-sm leading-relaxed text-white/55 sm:text-[0.9375rem]">
                        {feature.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative w-full lg:justify-self-end">
              <Image
                src="/artist-claim/dashboard.png"
                alt="Hiffi artist analytics dashboard on a desktop monitor"
                width={578}
                height={310}
                className="h-auto w-full"
                sizes="(max-width: 1024px) 100vw, 540px"
              />
              <div
                className="absolute bottom-[20%] left-0 flex min-w-[9.25rem] flex-col items-center justify-center rounded-2xl bg-[#E8192C] px-5 py-3.5 text-center shadow-[0_12px_40px_rgba(0,0,0,0.35)] sm:bottom-[18%] sm:left-1 sm:min-w-[10.5rem] sm:px-6 sm:py-4 lg:bottom-[19%] lg:left-2"
                aria-hidden
              >
                <span className="text-[1.75rem] font-black leading-none tracking-tight text-white sm:text-3xl">
                  FREE
                </span>
                <span className="mt-1.5 text-[9px] font-semibold uppercase leading-tight tracking-[0.14em] text-white sm:text-[10px] sm:tracking-[0.16em]">
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
