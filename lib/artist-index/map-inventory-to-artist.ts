import type { Artist } from "@/lib/artists"
import { formatCityName, formatStateCode } from "@/lib/artists"
import { getArtistImageUrl } from "@/lib/artist-directory"
import type { PublicInventoryProfile } from "@/lib/types/inventory"
import { getInventorySocialUrl } from "@/lib/types/inventory"
import { extractCreatorSameAs } from "@/lib/seo/social"

function pickSocialUrl(record: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }
  return null
}

function parseCityState(location: string | undefined): { city: string; state: string } {
  const trimmed = location?.trim()
  if (trimmed) {
    const parts = trimmed.split(",").map((part) => part.trim()).filter(Boolean)
    if (parts.length >= 2) {
      return {
        city: formatCityName(parts.slice(0, -1).join(", ")),
        state: formatStateCode(parts[parts.length - 1]),
      }
    }
    return { city: formatCityName(trimmed), state: "GA" }
  }

  return { city: "Atlanta", state: "GA" }
}

export function mapInventoryProfileToArtist(
  profile: PublicInventoryProfile,
  linkedProfile?: Record<string, unknown> | null,
): Artist {
  const username = profile.username.trim().toLowerCase()
  const linked = linkedProfile ?? null

  let name = profile.artist_name.trim() || username
  let bio = profile.bio?.trim() ?? ""
  let image: string | null = null
  let bannerImage: string | null = null
  let followers = 0
  let contactEmail: string | null = null
  let addedDate = "1970-01-01T00:00:00.000Z"
  let { city, state } = parseCityState(profile.location ?? undefined)

  let ig = getInventorySocialUrl(profile, "instagram") ?? null
  let yt = getInventorySocialUrl(profile, "youtube") ?? null
  let tt = getInventorySocialUrl(profile, "tiktok") ?? null
  let fb = getInventorySocialUrl(profile, "facebook") ?? null
  let spotify =
    typeof profile.other_socials?.spotify === "string" && profile.other_socials.spotify.trim()
      ? profile.other_socials.spotify.trim()
      : null

  if (linked) {
    name = String(linked.name ?? name).trim() || name
    const linkedBio = String(linked.bio ?? "").trim()
    if (linkedBio) bio = linkedBio
    const profilePicture = String(linked.profile_picture ?? linked.image ?? "").trim()
    image = getArtistImageUrl(profilePicture)
    const linkedBanner = String(linked.banner_image ?? linked.cover_image ?? "").trim()
    bannerImage = linkedBanner ? getArtistImageUrl(linkedBanner) : null
    followers = Number(linked.followers ?? 0)
    contactEmail = typeof linked.email === "string" ? linked.email.trim() || null : null
    addedDate = String(linked.created_at ?? addedDate)
    ;({ city, state } = parseCityState(
      typeof linked.location === "string" ? linked.location : profile.location ?? undefined,
    ))

    const sameAs = extractCreatorSameAs(linked)
    ig =
      pickSocialUrl(linked, "instagram", "instagram_url") ??
      sameAs.find((url) => url.includes("instagram.com")) ??
      ig
    yt =
      pickSocialUrl(linked, "youtube", "youtube_url") ??
      sameAs.find((url) => url.includes("youtube.com") || url.includes("youtu.be")) ??
      yt
    tt =
      pickSocialUrl(linked, "tiktok", "tiktok_url") ??
      sameAs.find((url) => url.includes("tiktok.com")) ??
      tt
    fb =
      pickSocialUrl(linked, "facebook", "facebook_url") ??
      sameAs.find((url) => url.includes("facebook.com")) ??
      fb
    spotify =
      pickSocialUrl(linked, "spotify", "spotify_url") ??
      sameAs.find((url) => url.includes("spotify.com")) ??
      spotify
  }

  return {
    slug: username,
    name,
    rank: 0,
    city,
    state,
    genre: ["Rap"],
    bio,
    image,
    banner_image: bannerImage,
    contact_email: contactEmail,
    spotify_url: spotify,
    ig_url: ig,
    ig_followers: null,
    yt_url: yt,
    yt_followers: null,
    tt_url: tt,
    tt_followers: null,
    fb_url: fb,
    total_reach: followers,
    claim_status: profile.claim_status,
    verified: profile.claim_status === "claimed",
    featured: false,
    added_date: addedDate,
  }
}
