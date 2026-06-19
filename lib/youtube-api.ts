import type { ParsedYoutubeTarget } from "@/lib/youtube-url"

type YoutubeListResponse<T> = {
  items?: T[]
  nextPageToken?: string
  error?: { message?: string }
}

type YoutubeChannelItem = {
  id?: string
}

type YoutubePlaylistItem = {
  snippet?: { channelId?: string }
}

async function youtubeGet<T>(
  accessToken: string,
  path: string,
  params: Record<string, string>,
): Promise<T> {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${path}`)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  const data = (await response.json()) as T & { error?: { message?: string } }
  if (!response.ok) {
    const message = data.error?.message ?? `YouTube API request failed (${response.status}).`
    throw new Error(message)
  }

  return data
}

export async function listManagedChannelIds(accessToken: string): Promise<Set<string>> {
  const ids = new Set<string>()
  let pageToken: string | undefined

  do {
    const params: Record<string, string> = {
      part: "id",
      mine: "true",
      maxResults: "50",
    }
    if (pageToken) params.pageToken = pageToken

    const data = await youtubeGet<YoutubeListResponse<YoutubeChannelItem>>(
      accessToken,
      "channels",
      params,
    )

    for (const item of data.items ?? []) {
      if (item.id) ids.add(item.id)
    }

    pageToken = data.nextPageToken
  } while (pageToken)

  return ids
}

async function resolveChannelIdByHandle(accessToken: string, handle: string): Promise<string | null> {
  const data = await youtubeGet<YoutubeListResponse<YoutubeChannelItem>>(accessToken, "channels", {
    part: "id",
    forHandle: handle,
  })
  return data.items?.[0]?.id ?? null
}

async function resolveChannelIdByUsername(accessToken: string, username: string): Promise<string | null> {
  const data = await youtubeGet<YoutubeListResponse<YoutubeChannelItem>>(accessToken, "channels", {
    part: "id",
    forUsername: username,
  })
  return data.items?.[0]?.id ?? null
}

async function resolveChannelIdByPlaylist(accessToken: string, playlistId: string): Promise<string | null> {
  const data = await youtubeGet<YoutubeListResponse<YoutubePlaylistItem>>(accessToken, "playlists", {
    part: "snippet",
    id: playlistId,
  })
  return data.items?.[0]?.snippet?.channelId ?? null
}

export async function resolveTargetChannelId(
  accessToken: string,
  target: ParsedYoutubeTarget,
): Promise<string | null> {
  switch (target.kind) {
    case "channel_id":
      return target.channelId
    case "handle":
      return resolveChannelIdByHandle(accessToken, target.handle)
    case "username":
      return resolveChannelIdByUsername(accessToken, target.username)
    case "playlist_id":
      return resolveChannelIdByPlaylist(accessToken, target.playlistId)
  }
}
