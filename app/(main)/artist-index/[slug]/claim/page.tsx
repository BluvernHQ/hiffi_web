import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ArrowRight } from "lucide-react"
import { ArtistDirectoryShell } from "@/components/artists/ArtistDirectoryShell"
import { ClaimForm } from "@/components/artists/ClaimForm"
import { ClaimAside } from "@/components/artists/claim/ClaimAside"
import { ClaimHero } from "@/components/artists/claim/ClaimHero"
import { ClaimApprovedNotice } from "@/components/artists/claim/ClaimReceiptNotices"
import { artistPageContainer } from "@/components/artists/artist-layout"
import { getArtistBySlug } from "@/lib/artists"
import { signalNarrow } from "@/lib/fonts/signal"
import { routeMetadata } from "@/lib/seo/route-metadata"
import { cn } from "@/lib/utils"

type ArtistClaimPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ArtistClaimPageProps): Promise<Metadata> {
  const { slug } = await params
  const artist = await getArtistBySlug(slug)

  if (!artist) {
    return routeMetadata({
      title: "Claim Artist Profile",
      description: "Claim your artist profile on Hiffi.",
      path: `/artist-index/${slug}/claim`,
      index: false,
    })
  }

  return routeMetadata({
    title:
      artist.claim_status === "pending"
        ? `Request ownership of ${artist.name}`
        : `Claim ${artist.name}`,
    description:
      artist.claim_status === "pending"
        ? `Request ownership of the ${artist.name} artist profile on Hiffi.`
        : `Submit a claim for the ${artist.name} artist profile on Hiffi.`,
    path: `/artist-index/${artist.slug}/claim`,
    index: false,
  })
}

export default async function ArtistClaimPage({ params }: ArtistClaimPageProps) {
  const { slug } = await params
  const artist = await getArtistBySlug(slug)

  if (!artist) {
    notFound()
  }

  const accountSetupEnabled = process.env.INVENTORY_CLAIM_ACCOUNT_SETUP === "true"
  const isClaimed = artist.claim_status === "claimed"
  const isPending = artist.claim_status === "pending"

  return (
    <ArtistDirectoryShell bleed claimHref={null}>
      <div className={cn(signalNarrow.variable, "text-[#0B0B0C]")}>
        <ClaimHero
          artist={artist}
          title={isPending ? `Request ownership of ${artist.name}` : `Claim ${artist.name}`}
          description={
            isClaimed
              ? "This profile has already been claimed and is managed by the artist."
              : isPending
                ? "This profile already has a pending claim. Set up your account and share your socials to request ownership. Our team reviews it alongside the existing claim."
                : "Set up your artist account, add your socials and tell us about your music."
          }
        />

        <div className={cn(artistPageContainer, "pb-16 pt-10 sm:pb-20 sm:pt-14")}>
          {isClaimed ? (
            <section className="mx-auto max-w-2xl rounded-[24px] border border-[#0B0B0C]/10 bg-white p-8 text-center shadow-[0_24px_60px_-40px_rgba(11,11,12,0.35)] sm:p-10">
              <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#77726A]">Already claimed</p>
              <h2 className="font-signal mt-3 text-[2.25rem] font-bold uppercase leading-[0.9] sm:text-[2.75rem]">
                {artist.name} is taken care of
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#77726A]">
                This profile is no longer accepting new claims.
              </p>
              <ClaimApprovedNotice slug={artist.slug} />
              <Link
                href={`/artist-index/${artist.slug}`}
                className="group mt-7 inline-flex items-center gap-2 rounded-full bg-[#0B0B0C] px-5 py-3 text-sm font-semibold text-[#F4F1EA] transition-colors hover:bg-black"
              >
                View profile
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </section>
          ) : (
            <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-14 xl:gap-20">
              <div className="min-w-0">
                <ClaimForm artist={artist} accountSetupEnabled={accountSetupEnabled} />
                <p className="mt-8 text-sm text-[#77726A]">
                  Not {artist.name}?{" "}
                  <Link
                    href="/artist-index"
                    className="font-semibold text-[#0B0B0C] underline decoration-[#0B0B0C]/25 underline-offset-4 transition-colors hover:decoration-[#0B0B0C]"
                  >
                    Search the artist index
                  </Link>
                </p>
              </div>
              <ClaimAside artistName={artist.name} accountSetupEnabled={accountSetupEnabled} />
            </div>
          )}
        </div>
      </div>
    </ArtistDirectoryShell>
  )
}
