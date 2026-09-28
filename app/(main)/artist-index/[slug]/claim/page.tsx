import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ArrowLeft } from "lucide-react"
import { ArtistIndexHeader } from "@/components/artists/ArtistIndexHeader"
import { ArtistAvatar } from "@/components/artists/ArtistAvatar"
import { ClaimForm } from "@/components/artists/ClaimForm"
import { formatCityState, formatGenreLabel, getArtistBySlug } from "@/lib/artists"
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

  return (
    <div className="min-h-screen bg-white">
      <ArtistIndexHeader claimHref={`/artist-index/${artist.slug}/claim`} />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <Link
          href={`/artist-index/${artist.slug}`}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to {artist.name}
        </Link>

        <div className="mb-8 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#E8192C]">
            Artist verification
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {artist.claim_status === "pending"
              ? `Request ownership of ${artist.name}`
              : `Claim ${artist.name}`}
          </h1>
          <p className="text-base text-muted-foreground">
            {artist.claim_status === "claimed"
              ? "This profile has already been claimed."
              : artist.claim_status === "pending"
                ? "This profile already has a pending claim. Set up your account and share your socials to request ownership — our team reviews it alongside the existing claim."
                : "Set up your artist account, add your socials and tell us about your music. Our team reviews every claim within 24–48 hours."}
          </p>
        </div>

        <div className="mb-8 flex items-center gap-4 rounded-2xl border border-border bg-muted/20 p-4 sm:p-5">
          <ArtistAvatar artist={artist} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold text-foreground">{artist.name}</p>
            <p className="truncate text-sm text-muted-foreground">
              {[formatCityState(artist), artist.genre.length > 0 ? formatGenreLabel(artist) : null]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <span
            className={
              artist.claim_status === "unclaimed"
                ? "shrink-0 rounded-full bg-[#E8192C]/10 px-3 py-1 text-xs font-semibold text-[#E8192C]"
                : "shrink-0 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900"
            }
          >
            {artist.claim_status === "unclaimed"
              ? "Unclaimed"
              : artist.claim_status === "pending"
                ? "Under review"
                : "Claimed"}
          </span>
        </div>

        {artist.claim_status === "claimed" ? (
          <div className="rounded-2xl border border-border bg-muted/20 p-8 text-center">
            <p className="text-lg font-semibold text-foreground">Already claimed</p>
            <p className="mt-2 text-sm text-muted-foreground">
              <strong>{artist.name}</strong> is no longer accepting new claim submissions.
            </p>
            <Link
              href={`/artist-index/${artist.slug}`}
              className="mt-6 inline-flex text-sm font-medium text-[#E8192C] hover:underline"
            >
              View profile
            </Link>
          </div>
        ) : (
          <ClaimForm
            artist={artist}
            accountSetupEnabled={process.env.INVENTORY_CLAIM_ACCOUNT_SETUP === "true"}
          />
        )}

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Not {artist.name}?{" "}
          <Link href="/artist-index" className="font-medium text-[#E8192C] hover:underline">
            Search the artist index
          </Link>
        </p>
      </main>

      <SiteFooter />
    </div>
  )
}
