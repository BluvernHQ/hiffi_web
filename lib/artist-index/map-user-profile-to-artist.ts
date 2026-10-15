import type { Artist } from "@/lib/artists"
import { formatCityName, formatStateCode } from "@/lib/artists"
import { getArtistImageUrl } from "@/lib/artist-directory"
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
  if (!trimmed) {
    return { city: "", state: "" }
  }

  const parts = trimmed.split(",").map((part) => part.trim()).filter(Boolean)
  if (parts.length >= 2) {
    return {
      city: formatCityName(parts.slice(0, -1).join(", ")),
      state: formatStateCode(parts[parts.length - 1]),
    }
  }

  return { city: formatCityName(trimmed), state: "" }
}

/**
 * Build an Artist-shaped model from a Hiffi user/creator profile so Artist Index
 * UI components can render on `/profile/{username}` for every creator.
 */
export function mapUserProfileToArtist(
  profileUser: Record<string, unknown>,
  usernameFallback: string,
): Artist {
  const username = String(profileUser.username ?? usernameFallback)
    .trim()
    .replace(/^@+/, "")
    .toLowerCase()

  const name =
    String(profileUser.name ?? "").trim() ||
    String(profileUser.username ?? usernameFallback).trim() ||
    username

  const bio = String(profileUser.bio ?? "").trim()
  const profilePicture = String(profileUser.profile_picture ?? profileUser.image ?? "").trim()
  const image = profilePicture ? getArtistImageUrl(profilePicture) : null
  const bannerRaw = String(
    profileUser.banner_image ?? profileUser.cover_image ?? profileUser.coverUrl ?? "",
  ).trim()
  const banner_image = bannerRaw ? getArtistImageUrl(bannerRaw) : null

  const { city, state } = parseCityState(
    typeof profileUser.location === "string" ? profileUser.location : undefined,
  )

  const genreRaw = profileUser.genre ?? profileUser.genres
  let genre: string[] = ["Rap"]
  if (typeof genreRaw === "string" && genreRaw.trim()) {
    genre = genreRaw
      .split(/[,/|]/)
      .map((g) => g.trim())
      .filter(Boolean)
      .map((g) => g.charAt(0).toUpperCase() + g.slice(1))
  } else if (Array.isArray(genreRaw)) {
    const parsed = genreRaw
      .map((g) => String(g).trim())
      .filter(Boolean)
      .map((g) => g.charAt(0).toUpperCase() + g.slice(1))
    if (parsed.length) genre = parsed
  }

  const sameAs = extractCreatorSameAs(profileUser)
  const ig =
    pickSocialUrl(profileUser, "instagram", "instagram_url") ??
    sameAs.find((url) => url.includes("instagram.com")) ??
    null
  const yt =
    pickSocialUrl(profileUser, "youtube", "youtube_url") ??
    sameAs.find((url) => url.includes("youtube.com") || url.includes("youtu.be")) ??
    null
  const tt =
    pickSocialUrl(profileUser, "tiktok", "tiktok_url") ??
    sameAs.find((url) => url.includes("tiktok.com")) ??
    null
  const fb =
    pickSocialUrl(profileUser, "facebook", "facebook_url") ??
    sameAs.find((url) => url.includes("facebook.com")) ??
    null
  const spotify =
    pickSocialUrl(profileUser, "spotify", "spotify_url") ??
    sameAs.find((url) => url.includes("spotify.com")) ??
    null

  const followers = Number(profileUser.followers ?? profileUser.follower_count ?? 0) || 0
  const contactEmail =
    typeof profileUser.email === "string" ? profileUser.email.trim() || null : null
  const addedDate = String(
    profileUser.created_at ?? profileUser.createdat ?? "1970-01-01T00:00:00.000Z",
  )

  return {
    slug: username,
    name,
    rank: 0,
    city,
    state,
    genre,
    bio,
    image,
    banner_image,
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
    // Platform creators are already onboarded — don't show inventory claim chrome.
    claim_status: "claimed",
    verified: true,
    featured: false,
    added_date: addedDate,
  }
}
