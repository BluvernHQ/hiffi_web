import type { ReactNode } from "react"
import Link from "next/link"
import { BadgeCheck } from "lucide-react"
import type { Artist } from "@/lib/artists"
import { getArtistImageUrl } from "@/lib/artist-directory"
import { artistProfilePhotoAlt, formatTotalReach, getPrimaryFollowerCount } from "@/lib/artists"
import { ArtistShareButton } from "@/components/artists/ArtistShareButton"
import { ClaimReceiptBanner } from "@/components/artists/claim/ClaimReceiptNotices"
import { Hiffi500RankPlate } from "@/components/artists/Hiffi500RankBadge"
import { cn } from "@/lib/utils"

type ArtistDetailHeroProps = {
  artist: Artist
  profilePath: string
  /** Live Hiffi video count when known (e.g. from /profile). */
  hiffiVideoCount?: number
  /**
   * When set, replaces the default claim / watch action cluster.
   * Used on `/profile/{username}` so we can show Follow / Edit instead of “Watch on Hiffi”.
   */
  actions?: ReactNode
  /** Show @handle under the display name (profile pages). */
  username?: string
  /** Hide the circular “Watch on Hiffi” link when already on the profile page. */
  hideWatchLink?: boolean
  /** Hide Verified / Unclaimed / Under Review chip (e.g. on `/profile`). */
  hideStatusBadge?: boolean
  /** Tighter mobile layout for embedded profile use. */
  compact?: boolean
  className?: string
}

export function ArtistDetailHero({
  artist,
  profilePath,
  hiffiVideoCount = 0,
  actions,
  username,
  hideWatchLink = false,
  hideStatusBadge = false,
  compact = false,
  className,
}: ArtistDetailHeroProps) {
  const claimHref = `/artist-index/${artist.slug}/claim`
  const followerCount = getPrimaryFollowerCount(artist)
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

  const statusBanner = (
    <>
      {isUnclaimed ? (
        <div className="mb-3 rounded-2xl border border-[#E8192C]/20 bg-[#E8192C]/5 px-4 py-3 sm:mb-4 sm:px-5">
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
        <div className="mb-3 rounded-2xl border border-amber-200/80 bg-amber-50/70 px-4 py-3 sm:mb-4 sm:px-5">
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
    </>
  )

  return (
    <section className={cn("mx-auto max-w-6xl", className)}>
      <ClaimReceiptBanner
        artist={{
          slug: artist.slug,
          name: artist.name,
          claim_status: artist.claim_status,
          verified: artist.verified,
        }}
        fallback={statusBanner}
      />

      <div
        className={cn(
          "overflow-hidden border border-border bg-zinc-950 text-white shadow-lg",
          compact ? "rounded-2xl sm:rounded-3xl" : "rounded-3xl",
        )}
      >
        <div
          className={cn(
            "relative",
            compact ? "h-32 sm:h-44 lg:h-52" : "h-40 sm:h-48 lg:h-52",
          )}
        >
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

          <div className="relative flex items-start justify-between gap-3 p-4 sm:p-6">
            <div className="flex min-w-0 flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] sm:text-xs">
              <Hiffi500RankPlate rank={artist.rank} />
              {!hideStatusBadge ? (
                artist.verified ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#4F7AE1] px-2.5 py-1 text-white sm:px-3 sm:py-1.5">
                    <BadgeCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span className="truncate">Verified Artist</span>
                  </span>
                ) : (
                  <span className="inline-flex rounded-full bg-white/15 px-2.5 py-1 text-white/90 backdrop-blur-sm sm:px-3 sm:py-1.5">
                    {isPending ? "Under Review" : "Unclaimed Profile"}
                  </span>
                )
              ) : null}
            </div>
            <ArtistShareButton title={artist.name} path={profilePath} />
          </div>
        </div>

        <div className={cn("relative pt-0", compact ? "px-4 pb-5 sm:px-8 sm:pb-8" : "px-5 pb-6 sm:px-8 sm:pb-8")}>
          <div
            className={cn(
              "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-5",
              compact ? "-mt-10 sm:-mt-14" : "-mt-12 sm:-mt-14",
            )}
          >
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
              <div className="shrink-0">
                {profileSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profileSrc}
                    alt={artistProfilePhotoAlt(artist.name)}
                    className={cn(
                      "rounded-full border-4 border-zinc-950 object-cover shadow-lg",
                      compact ? "h-20 w-20 sm:h-28 sm:w-28" : "h-24 w-24 sm:h-28 sm:w-28",
                    )}
                  />
                ) : (
                  <div
                    className={cn(
                      "flex items-center justify-center rounded-full border-4 border-zinc-950 bg-[#E8192C] font-bold text-white shadow-lg",
                      compact
                        ? "h-20 w-20 text-xl sm:h-28 sm:w-28 sm:text-2xl"
                        : "h-24 w-24 text-2xl sm:h-28 sm:w-28",
                    )}
                  >
                    {initials}
                  </div>
                )}
              </div>

              <div className="min-w-0 space-y-2 pb-0.5 sm:space-y-3 sm:pb-1">
                <div className="min-w-0 space-y-1">
                  <h1
                    className={cn(
                      "max-w-3xl break-words font-bold uppercase leading-[0.95] tracking-tight",
                      compact
                        ? "text-2xl sm:text-4xl lg:text-5xl"
                        : "text-3xl sm:text-4xl lg:text-5xl",
                    )}
                  >
                    {artist.name}
                  </h1>
                  {username?.trim() ? (
                    <p className="truncate text-sm font-medium normal-case tracking-normal text-white/70 sm:text-base">
                      @{username.trim().replace(/^@/, "")}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/75 sm:gap-x-5 sm:text-sm sm:tracking-[0.16em]">
                  {followerCount != null && followerCount > 0 ? (
                    <span>{formatTotalReach(followerCount, false)} Total Reach</span>
                  ) : null}
                  {hiffiVideoCount > 0 ? <span>{hiffiVideoCount} Hiffi Videos</span> : null}
                  {artist.genre.length > 0 ? <span>{artist.genre.join(" · ")}</span> : null}
                </div>
              </div>
            </div>

            <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:gap-3 sm:pb-1">
              {actions ?? (
                <>
                  {isUnclaimed ? (
                    <Link
                      href={claimHref}
                      className="inline-flex w-full items-center justify-center rounded-full bg-[#E8192C] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#d01528] sm:w-auto"
                    >
                      Claim your profile
                    </Link>
                  ) : isPending ? (
                    <Link
                      href={claimHref}
                      className={cn(
                        "inline-flex w-full items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors sm:w-auto",
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
                  {!hideWatchLink ? (
                    <Link
                      href={`/profile/${encodeURIComponent(artist.slug)}`}
                      className="inline-flex w-full items-center justify-center rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:w-auto"
                    >
                      Watch on Hiffi
                    </Link>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
