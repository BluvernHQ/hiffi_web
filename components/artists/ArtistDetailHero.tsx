import Link from "next/link"
import { BadgeCheck } from "lucide-react"
import type { Artist } from "@/lib/artists"
import { formatTotalReach, getPrimaryFollowerCount } from "@/lib/artists"
import { ArtistShareButton } from "@/components/artists/ArtistShareButton"
import { cn } from "@/lib/utils"

type ArtistDetailHeroProps = {
  artist: Artist
  profileUrl: string
}

export function ArtistDetailHero({ artist, profileUrl }: ArtistDetailHeroProps) {
  const claimHref = `/artist-index/${artist.slug}/claim`
  const searchHref = `/search?q=${encodeURIComponent(artist.name)}`
  const followerCount = getPrimaryFollowerCount(artist)

  return (
    <section className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl bg-zinc-900 text-white shadow-lg">
        {artist.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artist.image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0 bg-gradient-to-br from-[#E8192C]/70 via-[#8b0f1c] to-zinc-950"
            aria-hidden
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/20" aria-hidden />

        <div className="relative flex min-h-[320px] flex-col justify-between p-6 sm:min-h-[380px] sm:p-8 lg:p-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em]">
              {artist.verified ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8192C] px-3 py-1.5 text-white">
                  <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                  Verified Artist
                </span>
              ) : (
                <span className="inline-flex rounded-full bg-white/15 px-3 py-1.5 text-white/90 backdrop-blur-sm">
                  Unclaimed Profile
                </span>
              )}
              <span className="text-white/85">{artist.city.toUpperCase()}</span>
            </div>
            <ArtistShareButton title={artist.name} url={profileUrl} />
          </div>

          <div className="mt-auto flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-bold uppercase leading-none tracking-tight sm:text-5xl lg:text-6xl">
                {artist.name}
              </h1>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/80 sm:text-sm">
                <span>{formatTotalReach(followerCount, false)} Total Reach</span>
                <span>0 Videos</span>
                <span>0 Uploads</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={claimHref}
                className={cn(
                  "inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors",
                  "bg-white/15 hover:bg-white/25",
                )}
              >
                Claim Artist
              </Link>
              <Link
                href={searchHref}
                className="inline-flex items-center justify-center rounded-full bg-[#E8192C]/90 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#E8192C]"
              >
                View on Hiffi
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
