import Link from "next/link"
import { BadgeCheck, Search, ShieldCheck, SlidersHorizontal } from "lucide-react"
import { ArtistClaimSearch } from "@/components/artists/ArtistClaimSearch"
import { ArtistIndexFaq } from "@/components/artists/ArtistIndexFaq"
import {
  artistButtonOutline,
  artistPanelShell,
  HIFFI_ARTIST_RED,
} from "@/components/artists/artist-styles"
import {
  ARTIST_CLAIM_FEATURES,
  ARTIST_CLAIM_FAQ,
  ARTIST_CLAIM_STEPS,
  getArtistClaimAtlantaHref,
} from "@/lib/artist-index/claim-landing-seo"
import { artistIndexCityHref } from "@/lib/artist-directory"
import { cn } from "@/lib/utils"

const stepIcons = {
  search: Search,
  shield: ShieldCheck,
  sliders: SlidersHorizontal,
} as const

type ArtistClaimLandingProps = {
  artistCount: number
}

export function ArtistClaimLanding({ artistCount }: ArtistClaimLandingProps) {
  const countLabel = artistCount > 0 ? artistCount.toLocaleString() : "800"

  return (
    <div className="space-y-16 sm:space-y-20">
      {/* Hero */}
      <section className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center lg:gap-12">
        <div>
          <p className="inline-flex rounded-full border border-[#E8192C]/20 bg-[#E8192C]/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#E8192C]">
            Artist Central
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.08]">
            Is this your profile?{" "}
            <span className="text-[#E8192C]">Claim it now.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Take ownership of your listing on the Hiffi Artist Index. Verified artists update their
            bio and links, upload music videos, and help fans find the real you.
          </p>
          <div className="mt-8 max-w-xl">
            <ArtistClaimSearch />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Indexing {countLabel}+ artists in Atlanta today.{" "}
            <Link href={artistIndexCityHref("atlanta")} className="font-medium text-[#E8192C] hover:underline">
              Browse the directory
            </Link>
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div
            className={cn(
              artistPanelShell,
              "relative overflow-hidden border border-border bg-zinc-950 p-5 text-white shadow-lg sm:p-6",
            )}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                background: `radial-gradient(ellipse 80% 60% at 70% 20%, ${HIFFI_ARTIST_RED}55, transparent 60%)`,
              }}
              aria-hidden
            />
            <div className="relative space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E8192C]/20 text-sm font-bold text-[#E8192C]">
                    JK
                  </div>
                  <div>
                    <p className="font-semibold">Your artist profile</p>
                    <p className="inline-flex items-center gap-1 text-xs text-white/70">
                      <BadgeCheck className="h-3.5 w-3.5 text-[#E8192C]" aria-hidden />
                      Verified on Hiffi
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <p className="text-2xl font-bold text-[#E8192C]">{countLabel}+</p>
                  <p className="mt-1 text-xs text-white/60">Indexed ATL profiles</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <p className="text-2xl font-bold">24–48h</p>
                  <p className="mt-1 text-xs text-white/60">Typical claim review</p>
                </div>
              </div>
              <p className="text-sm text-white/70">
                Free verified badge · Official links · Music videos on Hiffi
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="claim-steps-heading">
        <h2 id="claim-steps-heading" className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          How it works
        </h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Three steps from search to a profile you control.
        </p>
        <ol className="mt-8 grid gap-6 md:grid-cols-3">
          {ARTIST_CLAIM_STEPS.map((item) => {
            const Icon = stepIcons[item.icon]
            return (
              <li
                key={item.step}
                className={cn(
                  artistPanelShell,
                  "relative border border-border bg-muted/10 p-6",
                )}
              >
                <span
                  className="pointer-events-none absolute right-4 top-2 text-5xl font-bold leading-none text-muted/80"
                  aria-hidden
                >
                  {item.step}
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8192C]/10 text-[#E8192C]">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </li>
            )
          })}
        </ol>
      </section>

      {/* Features */}
      <section
        aria-labelledby="claim-features-heading"
        className="overflow-hidden rounded-[1.5rem] bg-zinc-950 px-6 py-10 text-white sm:px-10 sm:py-12"
      >
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#E8192C]">
              For independent artists
            </p>
            <h2 id="claim-features-heading" className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Everything you need to own your presence
            </h2>
            <ul className="mt-8 space-y-5">
              {ARTIST_CLAIM_FEATURES.map((feature) => (
                <li key={feature.title} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E8192C] text-white">
                    <BadgeCheck className="h-3 w-3" aria-hidden />
                  </span>
                  <div>
                    <p className="font-semibold">{feature.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-white/70">{feature.description}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Link
              href={getArtistClaimAtlantaHref()}
              className={cn(artistButtonOutline, "mt-8 border-white/30 text-white hover:bg-white/10")}
            >
              Explore Atlanta artists
            </Link>
          </div>
          <div
            className={cn(
              artistPanelShell,
              "border border-white/10 bg-black/50 p-5 sm:p-6",
            )}
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
              After you claim
            </p>
            <ul className="mt-4 space-y-3 text-sm text-white/80">
              <li className="flex justify-between border-b border-white/10 pb-3">
                <span>Profile status</span>
                <span className="font-semibold text-[#E8192C]">Verified</span>
              </li>
              <li className="flex justify-between border-b border-white/10 pb-3">
                <span>Bio &amp; social links</span>
                <span className="text-white">Editable</span>
              </li>
              <li className="flex justify-between border-b border-white/10 pb-3">
                <span>Music videos</span>
                <span className="text-white">Upload on Hiffi</span>
              </li>
              <li className="flex justify-between">
                <span>Directory listing</span>
                <span className="text-white">Searchable</span>
              </li>
            </ul>
            <p className="mt-5 inline-flex rounded-full bg-[#E8192C] px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              Free verified artist badge
            </p>
          </div>
        </div>
      </section>

      <ArtistIndexFaq
        items={ARTIST_CLAIM_FAQ}
        title="Claiming FAQ"
        description="Common questions about finding, verifying, and managing your Hiffi artist profile."
      />

      <section
        className={cn(
          artistPanelShell,
          "border border-[#E8192C]/20 bg-[#E8192C]/[0.04] px-6 py-8 text-center sm:px-10",
        )}
      >
        <h2 className="text-xl font-bold text-foreground sm:text-2xl">Ready to find your listing?</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground sm:text-base">
          Search by stage name or jump into the Atlanta directory if you already know you are indexed.
        </p>
        <div className="mx-auto mt-6 max-w-lg">
          <ArtistClaimSearch size="default" />
        </div>
      </section>
    </div>
  )
}
