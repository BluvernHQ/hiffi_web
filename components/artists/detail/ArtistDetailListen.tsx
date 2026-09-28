import type { ComponentType } from "react"
import { ArrowUpRight } from "lucide-react"
import type { Artist } from "@/lib/artists"
import {
  FacebookIcon,
  InstagramIcon,
  SpotifyIcon,
  TikTokIcon,
  YouTubeIcon,
} from "@/components/artists/ArtistSocialLinks"
import { ArtistDetailEyebrow } from "@/components/artists/detail/ArtistDetailSection"
import {
  artistClaimState,
  artistPlatformLinks,
  type ArtistPlatformKey,
} from "@/components/artists/detail/artist-detail-data"

const PLATFORM_ICON: Record<ArtistPlatformKey, { Icon: ComponentType<{ className?: string }>; hover: string }> = {
  yt_url: { Icon: YouTubeIcon, hover: "group-hover:bg-[#FF0033]" },
  spotify_url: { Icon: SpotifyIcon, hover: "group-hover:bg-[#1DB954]" },
  ig_url: { Icon: InstagramIcon, hover: "group-hover:bg-[#D62976]" },
  tt_url: { Icon: TikTokIcon, hover: "group-hover:bg-[#25F4EE] group-hover:text-[#0B0B0C]" },
  fb_url: { Icon: FacebookIcon, hover: "group-hover:bg-[#1877F2]" },
}

export function ArtistDetailListen({ artist }: { artist: Artist }) {
  const links = artistPlatformLinks(artist)

  return (
    <section aria-labelledby="artist-listen">
      <ArtistDetailEyebrow>Listen &amp; follow</ArtistDetailEyebrow>
      <h2 id="artist-listen" className="sr-only">
        {artist.name} on streaming and social
      </h2>

      {links.length > 0 ? (
        <ul className="mt-5 border-t border-[#0B0B0C]/12">
          {links.map((link) => {
            const { Icon, hover } = PLATFORM_ICON[link.key]
            return (
              <li key={link.key}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 border-b border-[#0B0B0C]/12 py-3.5"
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0B0B0C] text-[#F4F1EA] transition-colors duration-300 ${hover}`}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-[#0B0B0C]">{link.label}</span>
                    <span className="block truncate text-[13px] text-[#77726A]">{link.handle}</span>
                  </span>
                  <ArrowUpRight
                    className="h-4 w-4 shrink-0 text-[#0B0B0C]/40 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#0B0B0C]"
                    aria-hidden
                  />
                </a>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="mt-5 text-sm leading-6 text-[#77726A]">
          {artistClaimState(artist) === "verified"
            ? "No official links added yet."
            : "Official links appear here once this page is claimed."}
        </p>
      )}
    </section>
  )
}
