import { getThumbnailUrl } from "@/lib/storage"
import { getPrimaryPreviewStreamUrl } from "@/lib/feed-preview/resolve-preview-url"
import {
  formatCompactCount,
  getVideoViewCount,
  shouldShowVideoViewCount,
} from "@/lib/video-utils"

/** Card model for the homepage hero carousel. */
export type HeroCarouselCard = {
  id: string
  title: string
  thumbnail: string
  videoUrl: string
  /** Original API storage path — used to rebuild the playback ladder. */
  storagePath?: string
  artistName: string
  handle: string
  viewCount: number
  viewCountLabel: string | null
  href: string
  /**
   * Raw profile_picture path from the API (not a thumbnail URL).
   * Pass through ProfilePicture so guests and logged-in users both get the proxy avatar.
   */
  profilePicture?: string
  userUpdatedAt?: string
}

/** Demo / Storybook-style mock cards when feed data is unavailable. */
export const MOCK_HERO_CAROUSEL_CARDS: HeroCarouselCard[] = [
  {
    id: "mock-1",
    title: "Midnight Drill — Official Video",
    thumbnail: "/hiffi_logo.png",
    videoUrl: "",
    artistName: "Nova Blade",
    handle: "novablade",
    viewCount: 128_400,
    viewCountLabel: "128.4K",
    href: "/watch/mock-1",
  },
  {
    id: "mock-2",
    title: "City Lights Freestyle",
    thumbnail: "/hiffi_logo.png",
    videoUrl: "",
    artistName: "Kairo West",
    handle: "kairowest",
    viewCount: 54_200,
    viewCountLabel: "54.2K",
    href: "/watch/mock-2",
  },
  {
    id: "mock-3",
    title: "Signed & Loaded",
    thumbnail: "/hiffi_logo.png",
    videoUrl: "",
    artistName: "Apex Lane",
    handle: "apexlane",
    viewCount: 210_000,
    viewCountLabel: "210K",
    href: "/watch/mock-3",
  },
  {
    id: "mock-4",
    title: "Low Frequency",
    thumbnail: "/hiffi_logo.png",
    videoUrl: "",
    artistName: "Mira Sound",
    handle: "mirasound",
    viewCount: 18_900,
    viewCountLabel: "18.9K",
    href: "/watch/mock-4",
  },
  {
    id: "mock-5",
    title: "On Sight Visualizer",
    thumbnail: "/hiffi_logo.png",
    videoUrl: "",
    artistName: "Trap House Collective",
    handle: "traphouse",
    viewCount: 92_100,
    viewCountLabel: "92.1K",
    href: "/watch/mock-5",
  },
]

/** Map feed /videos/list rows into hero carousel cards. */
export function mapVideosToHeroCards(
  videos: Array<Record<string, unknown>>,
  limit = 5,
): HeroCarouselCard[] {
  const cards: HeroCarouselCard[] = []

  for (let i = 0; i < videos.length && cards.length < limit; i++) {
    const video = videos[i]!
    const id = String(video.video_id || video.videoId || "").trim()
    if (!id) continue

    const handle = String(video.user_username || video.userUsername || "").trim()
    const artistName = String(
      video.user_name || video.userName || video.creator_name || handle || "Artist",
    ).trim()
    const title = String(video.video_title || video.videoTitle || "Video").trim()
    const thumbPath = String(video.video_thumbnail || video.videoThumbnail || "").trim()
    const thumbnail = thumbPath ? getThumbnailUrl(thumbPath) : ""
    const storagePath = String(video.video_url || video.videoUrl || "").trim()
    const videoUrl =
      getPrimaryPreviewStreamUrl({
        video_id: id,
        video_url: storagePath || undefined,
        profiles: Array.isArray(video.profiles) ? (video.profiles as string[]) : null,
        original_profile:
          (video.original_profile as string | undefined) ||
          (video.originalProfile as string | undefined) ||
          null,
      }) || ""
    const viewCount = getVideoViewCount(video as never)
    const viewCountLabel = shouldShowVideoViewCount(viewCount)
      ? formatCompactCount(viewCount)
      : null
    const profilePicture = String(
      video.user_profile_picture ||
        video.userProfilePicture ||
        video.profile_picture ||
        (video.user && typeof video.user === "object"
          ? (video.user as Record<string, unknown>).profile_picture
          : "") ||
        "",
    ).trim()
    const userUpdatedAt = String(
      video.user_updated_at || video.userUpdatedAt || video.updated_at || "",
    ).trim()

    cards.push({
      id,
      title,
      thumbnail,
      videoUrl,
      storagePath: storagePath || undefined,
      artistName: artistName || handle || "Artist",
      handle,
      viewCount,
      viewCountLabel,
      href: `/watch/${encodeURIComponent(id)}`,
      profilePicture: profilePicture || undefined,
      userUpdatedAt: userUpdatedAt || undefined,
    })
  }

  return cards
}
