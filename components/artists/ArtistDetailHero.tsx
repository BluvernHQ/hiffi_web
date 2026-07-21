import Link from "next/link"
import { BadgeCheck } from "lucide-react"
import type { Artist } from "@/lib/artists"
import { getArtistImageUrl } from "@/lib/artist-directory"
import { formatCityName, formatTotalReach, getPrimaryFollowerCount } from "@/lib/artists"
import { ArtistShareButton } from "@/components/artists/ArtistShareButton"
import { cn } from "@/lib/utils"

type ArtistDetailHeroProps = {
  artist: Artist
  profilePath: string
}

export function ArtistDetailHero({ artist, profilePath }: ArtistDetailHeroProps) {
  const claimHref = `/artist-index/${artist.slug}/claim`
  const followerCount = getPrimaryFollowerCount(artist)
  const hiffiVideoCount = 0
  const isUnclaimed = !artist.verified && artist.claim_status === "unclaimed"
  const isPending = !artist.verified && artist.claim_status === "pending"

  const bannerSrc = getArtistImageUrl(artist.banner_image)
  const profileSrc = getArtistImageUrl(artist.image)
  const initials = artist.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <section className="mx-auto max-w-6xl">
      {isUnclaimed ? (
        <div className="mb-4 rounded-2xl border border-[#E8192C]/20 bg-[#E8192C]/5 px-4 py-3 sm:px-5">
          <p className="text-sm text-foreground">
            <span className="font-semibold text-[#E8192C]">Unclaimed profile.</span>{" "}
            Are you {artist.name}?{" "}
            <Link href={claimHref} className="font-semibold text-[#E8192C] underline-offset-2 hover:underline">
              Claim your account
            </Link>{" "}
            to unlock brand sponsorships, paid collaborations, partner offers, and benefits worth up
            to $10K for select creators.
          </p>
        </div>
      ) : null}

      {isPending ? (
        <div className="mb-4 rounded-2xl border border-amber-200/80 bg-amber-50/70 px-4 py-3 sm:px-5">
          <p className="text-sm text-amber-950">
            <span className="font-semibold">This profile has a pending ownership verification.</span>{" "}
            If you believe you are the rightful owner, you can{" "}
            <Link
              href={claimHref}
              className="font-semibold text-amber-950 underline-offset-2 hover:underline"
            >
              request ownership
            </Link>
            .
          </p>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-border bg-zinc-950 text-white shadow-lg">
        <div className="relative h-40 sm:h-48 lg:h-52">
          {bannerSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bannerSrc} alt="" className="absolute inset-0 h-full w-full object-cover" aria-hidden />
          ) : (
            <div
              className="absolute inset-0 bg-gradient-to-br from-[#E8192C]/70 via-[#8b0f1c] to-zinc-950"
              aria-hidden
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/20 to-transparent" aria-hidden />

          <div className="relative flex items-start justify-between p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em]">
              {artist.verified ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8192C] px-3 py-1.5 text-white">
                  <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                  Verified Artist
                </span>
              ) : (
                <span className="inline-flex rounded-full bg-white/15 px-3 py-1.5 text-white/90 backdrop-blur-sm">
                  {isPending ? "Under Review" : "Unclaimed Profile"}
                </span>
              )}
              <span className="normal-case text-white/85">{formatCityName(artist.city)}</span>
            </div>
            <ArtistShareButton title={artist.name} path={profilePath} />
          </div>
        </div>

        <div className="relative px-5 pb-6 pt-0 sm:px-8 sm:pb-8">
          <div className="-mt-12 flex flex-col gap-5 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="shrink-0">
                {profileSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profileSrc}
                    alt={`${artist.name} — hip-hop artist profile photo`}
                    className="h-24 w-24 rounded-full border-4 border-zinc-950 object-cover shadow-lg sm:h-28 sm:w-28"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-zinc-950 bg-[#E8192C] text-2xl font-bold text-white shadow-lg sm:h-28 sm:w-28">
                    {initials}
                  </div>
                )}
              </div>

              <div className="space-y-3 pb-1">
                <h1 className="max-w-3xl text-3xl font-bold uppercase leading-none tracking-tight sm:text-4xl lg:text-5xl">
                  {artist.name}
                </h1>
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/75 sm:text-sm">
                  {followerCount != null && followerCount > 0 ? (
                    <span>{formatTotalReach(followerCount, false)} Total Reach</span>
                  ) : null}
                  {hiffiVideoCount > 0 ? <span>{hiffiVideoCount} Hiffi Videos</span> : null}
                  <span>{artist.genre.join(" · ")}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 sm:pb-1">
              {isUnclaimed ? (
                <Link
                  href={claimHref}
                  className="inline-flex items-center justify-center rounded-full bg-[#E8192C] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#d01528]"
                >
                  Claim your profile
                </Link>
              ) : isPending ? (
                <Link
                  href={claimHref}
                  className={cn(
                    "inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors",
                    "bg-white/15 hover:bg-white/25",
                  )}
                >
                  Request ownership
                </Link>
              ) : (
                <span
                  className={cn(
                    "inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm",
                    "bg-white/15",
                  )}
                >
                  Claimed
                </span>
              )}
              <Link
                href={`/profile/${encodeURIComponent(artist.slug)}`}
                className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                Watch on Hiffi
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
