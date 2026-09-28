import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ArrowLeft } from "lucide-react"
import { ArtistIndexHeader } from "@/components/artists/ArtistIndexHeader"
import { ClaimForm } from "@/components/artists/ClaimForm"
import { ClaimAside } from "@/components/artists/claim/ClaimAside"
import { ClaimHero } from "@/components/artists/claim/ClaimHero"
import { ClaimApprovedNotice } from "@/components/artists/claim/ClaimReceiptNotices"
import { getArtistBySlug } from "@/lib/artists"
import { routeMetadata } from "@/lib/seo/route-metadata"
import { SiteFooter } from "@/components/layout/site-footer"

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

  return (
    <div className="min-h-screen bg-white">
      <ArtistIndexHeader claimHref={`/artist-index/${artist.slug}/claim`} />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <Link
          href={`/artist-index/${artist.slug}`}
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to {artist.name}
        </Link>

        <ClaimHero
          artist={artist}
          title={
            artist.claim_status === "pending"
              ? `Request ownership of ${artist.name}`
              : `Claim ${artist.name}`
          }
        />

        <div
          className={
            isClaimed
              ? "mt-8"
              : "mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-14"
          }
        >
          <div className="min-w-0">
            <p className="mb-6 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
              {isClaimed
                ? "This profile has already been claimed."
                : artist.claim_status === "pending"
                  ? "This profile already has a pending claim. Set up your account and share your socials to request ownership — our team reviews it alongside the existing claim."
                  : "Set up your artist account, add your socials and tell us about your music. It takes about two minutes."}
            </p>

            {isClaimed ? (
              <div className="rounded-2xl border border-border bg-muted/20 p-8 text-center">
                <p className="text-lg font-semibold text-foreground">Already claimed</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  <strong>{artist.name}</strong> is no longer accepting new claim submissions.
                </p>
                <ClaimApprovedNotice slug={artist.slug} />
                <Link
                  href={`/artist-index/${artist.slug}`}
                  className="mt-6 inline-flex text-sm font-medium text-[#E8192C] hover:underline"
                >
                  View profile
                </Link>
              </div>
            ) : (
              <ClaimForm artist={artist} accountSetupEnabled={accountSetupEnabled} />
            )}

            <p className="mt-8 text-sm text-muted-foreground">
              Not {artist.name}?{" "}
              <Link href="/artist-index" className="font-medium text-[#E8192C] hover:underline">
                Search the artist index
              </Link>
            </p>
          </div>

          {isClaimed ? null : (
            <ClaimAside artistName={artist.name} accountSetupEnabled={accountSetupEnabled} />
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
