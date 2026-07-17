import type { Artist } from "@/lib/artists"
import { formatCityState, formatTotalReach, getPrimaryFollowerCount } from "@/lib/artists"
import { getArtistDisplayBio } from "@/lib/artist-directory-seo"
import { cn } from "@/lib/utils"

type ArtistDetailAboutProps = {
  artist: Artist
}

function DetailField({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1.5 text-sm font-medium",
          highlight ? "font-semibold text-[#E8192C]" : "text-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  )
}

export function ArtistDetailAbout({ artist }: ArtistDetailAboutProps) {
  const profileStatus = artist.verified
    ? "Verified"
    : artist.claim_status === "pending"
      ? "Under Review"
      : "Unclaimed Profile"

  const sound = artist.genre.join(" / ")
  const displayBio = getArtistDisplayBio(artist)
  const hasCustomBio = Boolean(artist.bio?.trim())
  const reach = getPrimaryFollowerCount(artist)
  const hiffiVideoCount = 0

  return (
    <section className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground">
        About the artist
      </h2>
      <div className="mt-4 border-t border-border" aria-hidden />

      <dl className="mt-6 grid gap-6 sm:grid-cols-2">
        {reach != null && reach > 0 ? (
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
          "mt-8 text-sm leading-relaxed text-muted-foreground",
          !hasCustomBio && "italic",
        )}
      >
        {displayBio}
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Watch their videos on Hiffi and follow their official links to stay connected with new
        releases, visuals, and updates.
      </p>
    </section>
  )
}
