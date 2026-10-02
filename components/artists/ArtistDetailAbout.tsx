import type { Artist } from "@/lib/artists"
import { formatCityState, formatTotalReach, getPrimaryFollowerCount } from "@/lib/artists"
import { getArtistDisplayBio } from "@/lib/artist-directory-seo"
import { cn } from "@/lib/utils"
import { shouldShowProfileFollowerCount } from "@/lib/video-utils"

type ArtistDetailAboutProps = {
  artist: Artist
  /** Live Hiffi video count when known (e.g. from /profile). */
  hiffiVideoCount?: number
  /** Footer CTA under the bio. Hidden on `/profile` where videos already appear below. */
  showWatchPrompt?: boolean
}

function DetailField({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:text-[11px]">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 break-words text-sm font-medium sm:mt-1.5",
          highlight ? "font-semibold text-[#E8192C]" : "text-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  )
}

export function ArtistDetailAbout({
  artist,
  hiffiVideoCount = 0,
  showWatchPrompt = true,
}: ArtistDetailAboutProps) {
  const profileStatus = artist.verified
    ? "Verified"
    : artist.claim_status === "pending"
      ? "Under Review"
      : "Unclaimed Profile"

  const sound = artist.genre.join(" / ")
  const displayBio = getArtistDisplayBio(artist)
  const hasCustomBio = Boolean(artist.bio?.trim())
  const reach = getPrimaryFollowerCount(artist)

  return (
    <section className="rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-6 md:p-8">
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground">
        About the artist
      </h2>
      <div className="mt-3 border-t border-border sm:mt-4" aria-hidden />

      <dl className="mt-4 grid grid-cols-2 gap-4 sm:mt-6 sm:gap-6">
        {reach != null && shouldShowProfileFollowerCount(reach) ? (
          <DetailField label="Total reach" value={formatTotalReach(reach, false)} />
        ) : null}
        <DetailField label="Artist name" value={artist.name} />
        <DetailField label="Sound" value={sound} />
        {hiffiVideoCount > 0 ? (
          <DetailField
            label="Hiffi videos"
            value={`${hiffiVideoCount} available`}
          />
        ) : null}
        <DetailField label="City" value={formatCityState(artist)} />
        <DetailField label="Profile status" value={profileStatus} highlight={artist.verified} />
      </dl>

      <p
        className={cn(
          "mt-6 text-sm leading-relaxed text-muted-foreground sm:mt-8",
          !hasCustomBio && "italic",
        )}
      >
        {displayBio}
      </p>
      {showWatchPrompt ? (
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Watch their videos on Hiffi and follow their official links to stay connected with new
          releases, visuals, and updates.
        </p>
      ) : null}
    </section>
  )
}
