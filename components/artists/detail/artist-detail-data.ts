import type { Artist } from "@/lib/artists"
import { getShortCityLabel } from "@/lib/artists"

export type ArtistPlatformKey = "yt_url" | "spotify_url" | "ig_url" | "tt_url" | "fb_url"

export type ArtistClaimState = "verified" | "pending" | "unclaimed"

export function artistClaimState(artist: Pick<Artist, "verified" | "claim_status">): ArtistClaimState {
  if (artist.verified || artist.claim_status === "claimed") return "verified"
  if (artist.claim_status === "pending") return "pending"
  return "unclaimed"
}

const COUNTRY_ONLY = new Set(["united states", "usa", "us", "united states of america"])

/** "Chicago" / "Houston, TX" — null when the location is missing or just a country. */
export function artistPlaceLabel(artist: Pick<Artist, "city" | "state">): string | null {
  const city = getShortCityLabel(artist as Artist)
  if (!city || COUNTRY_ONLY.has(city.toLowerCase())) return null
  const state = artist.state?.trim().toUpperCase()
  if (state && state.length <= 3 && !COUNTRY_ONLY.has(state.toLowerCase()) && !city.toUpperCase().includes(state)) {
    return `${city}, ${state}`
  }
  return city
}

const NOISE_LINE = [
  /https?:\/\//i,
  /www\./i,
  /[\w.+-]+@[\w-]+\.[\w.]+/,
  /^(contact|booking|bookings|business|inquiries|enquiries|website|shop|merch|management|mgmt|email|instagram|twitter|ig|tiktok|snapchat|stream|follow)\b/i,
  /official\s+(youtube\s+)?(channel|page)/i,
  /^subscribe\b/i,
]

/**
 * Most bios are pasted YouTube channel descriptions. Keep the prose, drop the
 * contact lines, link dumps and "official channel" boilerplate.
 */
export function cleanArtistBio(bio: string | null | undefined): string[] {
  const raw = bio?.replace(/\r\n?/g, "\n").trim()
  if (!raw) return []

  const paragraphs = raw
    .split(/\n{2,}/)
    .map((block) =>
      block
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !NOISE_LINE.some((pattern) => pattern.test(line)))
        .join(" ")
        .replace(/\s{2,}/g, " ")
        .trim(),
    )
    .filter(Boolean)

  const letters = paragraphs.join(" ").replace(/[^\p{L}]/gu, "")
  return letters.length >= 12 ? paragraphs : []
}

export type ArtistPlatformLink = {
  key: ArtistPlatformKey
  label: string
  href: string
  handle: string
}

const PLATFORM_ORDER: Array<{ key: ArtistPlatformKey; label: string }> = [
  { key: "yt_url", label: "YouTube" },
  { key: "spotify_url", label: "Spotify" },
  { key: "ig_url", label: "Instagram" },
  { key: "tt_url", label: "TikTok" },
  { key: "fb_url", label: "Facebook" },
]

function platformHandle(key: ArtistPlatformKey, href: string): string {
  try {
    const parts = new URL(href).pathname.split("/").filter(Boolean)
    const first = parts[0] ?? ""
    const last = parts[parts.length - 1] ?? ""

    if (key === "yt_url") {
      if (first.startsWith("@")) return first
      if ((first === "c" || first === "user") && parts[1]) return parts[1]
      return "Official channel"
    }
    if (key === "spotify_url") return "Artist profile"
    if (!last || last === "profile.php") return "Official page"
    return `@${last.replace(/^@/, "")}`
  } catch {
    return "Official page"
  }
}

export function artistPlatformLinks(artist: Artist): ArtistPlatformLink[] {
  return PLATFORM_ORDER.flatMap(({ key, label }) => {
    const href = artist[key]?.trim()
    if (!href) return []
    return [{ key, label, href, handle: platformHandle(key, href) }]
  })
}

/** Where "Listen" goes: YouTube, then Spotify, then whatever exists. */
export function primaryListenLink(artist: Artist): ArtistPlatformLink | null {
  const links = artistPlatformLinks(artist)
  return links.find((link) => link.key === "yt_url" || link.key === "spotify_url") ?? null
}

export function artistInitials(name: string): string {
  const letters = name
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
  return (letters || name.slice(0, 1)).slice(0, 2).toUpperCase()
}

export function formatChartWeek(iso: string | null | undefined): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}
