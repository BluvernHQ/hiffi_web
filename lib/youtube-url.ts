export type ParsedYoutubeTarget =
  | { kind: "channel_id"; channelId: string }
  | { kind: "handle"; handle: string }
  | { kind: "username"; username: string }
  | { kind: "playlist_id"; playlistId: string }

export function parseYoutubeTargetUrl(raw: string): ParsedYoutubeTarget | null {
  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    return null
  }

  const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "")
  if (host !== "youtube.com" && host !== "youtu.be") return null

  if (host === "youtu.be") return null

  const playlistId = url.searchParams.get("list")
  if (playlistId) return { kind: "playlist_id", playlistId }

  const parts = url.pathname.split("/").filter(Boolean)
  if (parts.length === 0) return null

  if (parts[0] === "channel" && parts[1]) {
    return { kind: "channel_id", channelId: parts[1] }
  }

  if (parts[0]?.startsWith("@")) {
    return { kind: "handle", handle: parts[0].slice(1) }
  }

  if (parts[0] === "user" && parts[1]) {
    return { kind: "username", username: parts[1] }
  }

  if (parts[0] === "c" && parts[1]) {
    return { kind: "handle", handle: parts[1] }
  }

  return null
}
