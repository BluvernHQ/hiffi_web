"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { Artist } from "@/lib/artists"
import {
  formatFollowerCount,
  formatGenreLabel,
  formatTotalReach,
  getManagementLabel,
  getSocialHandle,
} from "@/lib/artists"
import { ArtistAvatar } from "@/components/artists/ArtistAvatar"
import { cn } from "@/lib/utils"

type ArtistPreviewPanelProps = {
  artist: Artist
}

function StatField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

function SocialField({
  label,
  handle,
  followers,
  href,
}: {
  label: string
  handle: string | null
  followers: number | null
  href: string | null
}) {
  if (!href || !handle) return null

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 block text-sm font-medium text-foreground transition-colors hover:text-[#E8192C]"
      >
        {handle}
        {followers != null ? (
          <span className="text-muted-foreground"> ({formatFollowerCount(followers)})</span>
        ) : null}
      </a>
    </div>
  )
}

export function ArtistPreviewPanel({ artist }: ArtistPreviewPanelProps) {
  const management = getManagementLabel(artist)
  const profileHref = `/artist-index/${artist.slug}`

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-4">
        <ArtistAvatar artist={artist} size="lg" />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#E8192C]">
            {artist.rank}. {artist.name}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{formatGenreLabel(artist)}</p>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground">Stats</p>
        <div className="mt-3 border-t border-border pt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Current total reach
          </p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">
            {formatTotalReach(artist.total_reach)}
          </p>
        </div>
      </div>

      <div className="mt-6 grid flex-1 gap-4 sm:grid-cols-2">
        {management ? <StatField label="Management" value={management} /> : null}
        <SocialField
          label="Instagram"
          handle={getSocialHandle(artist.ig_url)}
          followers={artist.ig_followers}
          href={artist.ig_url}
        />
        <SocialField
          label="YouTube"
          handle={getSocialHandle(artist.yt_url)}
          followers={artist.yt_followers}
          href={artist.yt_url}
        />
        <SocialField
          label="Facebook"
          handle={getSocialHandle(artist.fb_url ?? null)}
          followers={artist.fb_followers ?? null}
          href={artist.fb_url ?? null}
        />
        <SocialField
          label="TikTok"
          handle={getSocialHandle(artist.tt_url)}
          followers={artist.tt_followers}
          href={artist.tt_url}
        />
      </div>

      <Link
        href={profileHref}
        className={cn(
          "mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#E8192C]",
          "transition-colors hover:text-[#d01528]",
        )}
      >
        See full artist profile
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  )
}
