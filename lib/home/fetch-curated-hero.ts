import { apiClient } from "@/lib/api-client"
import {
  mapVideosToHeroCards,
  type HeroCarouselCard,
} from "@/lib/home/hero-carousel-data"

const HERO_LIMIT = 5
/** How many curated mixes to sample from for the hero strip. */
const PLAYLIST_SAMPLE = 8
/** Pull a few items from each mix so round-robin has enough unique IDs. */
const PER_PLAYLIST_FETCH = 4

export type CuratedHeroResult = {
  cards: HeroCarouselCard[]
  /** Primary playlist for analytics (first mix that contributed a video). */
  playlistId: string | null
  playlistTitle: string | null
  /** All curated mixes represented in the hero. */
  playlistIds: string[]
}

type PickedId = {
  videoId: string
  playlistId: string
}

/**
 * Load hero cards by sampling across curated playlists (not just the first mix).
 * Round-robins unique video IDs from each mix, then hydrates via GET /videos/{id}.
 */
export async function fetchCuratedHeroCards(
  limit = HERO_LIMIT,
): Promise<CuratedHeroResult> {
  const empty: CuratedHeroResult = {
    cards: [],
    playlistId: null,
    playlistTitle: null,
    playlistIds: [],
  }

  try {
    const listed = await apiClient.listCuratedPlaylists({
      limit: PLAYLIST_SAMPLE,
      offset: 0,
    })
    const playlists = (listed.playlists || []).filter(
      (p) => Boolean(p.playlist_id) && Boolean(p.title),
    )
    if (playlists.length === 0) return empty

    // Fetch a small page from every curated mix in parallel.
    const perPlaylistIds = await Promise.all(
      playlists.map(async (playlist) => {
        try {
          const detail = await apiClient.getCuratedPlaylist(playlist.playlist_id, {
            limit: PER_PLAYLIST_FETCH,
            offset: 0,
          })
          const ids = (detail.items || [])
            .map((item) => item.video_id)
            .filter(Boolean)
          return {
            playlistId: playlist.playlist_id,
            title: playlist.title,
            ids,
          }
        } catch {
          return { playlistId: playlist.playlist_id, title: playlist.title, ids: [] as string[] }
        }
      }),
    )

    const withVideos = perPlaylistIds.filter((row) => row.ids.length > 0)
    if (withVideos.length === 0) return empty

    // Round-robin across mixes so the filmstrip isn't dominated by one playlist.
    const picked: PickedId[] = []
    const seen = new Set<string>()
    let cursor = 0
    while (picked.length < limit) {
      let addedThisPass = false
      for (const row of withVideos) {
        if (picked.length >= limit) break
        const id = row.ids[cursor]
        if (!id || seen.has(id)) continue
        seen.add(id)
        picked.push({ videoId: id, playlistId: row.playlistId })
        addedThisPass = true
      }
      if (!addedThisPass) break
      cursor += 1
    }

    if (picked.length === 0) return empty

    const playlistByVideo = new Map(picked.map((p) => [p.videoId, p.playlistId]))

    const hydrated = await Promise.all(
      picked.map(async ({ videoId }) => {
        try {
          const res = await apiClient.getVideo(videoId)
          const video = (res.video || {}) as Record<string, unknown>
          return {
            ...video,
            video_id: videoId,
            user_profile_picture:
              video.user_profile_picture ||
              video.profile_picture ||
              res.profile_picture ||
              undefined,
          } as Record<string, unknown>
        } catch {
          return null
        }
      }),
    )

    const videos = hydrated.filter((v): v is Record<string, unknown> => Boolean(v))
    // Watch opens as a standalone video (no playlist queue) from the home hero.
    const cards = mapVideosToHeroCards(videos, limit)

    if (cards.length === 0) return empty

    const contributingIds = [
      ...new Set(
        cards
          .map((card) => playlistByVideo.get(card.id))
          .filter((id): id is string => Boolean(id)),
      ),
    ]
    const primaryId = contributingIds[0] ?? null
    const primaryTitle =
      withVideos.find((row) => row.playlistId === primaryId)?.title ?? null

    return {
      cards,
      playlistId: primaryId,
      playlistTitle: primaryTitle,
      playlistIds: contributingIds,
    }
  } catch {
    return empty
  }
}
