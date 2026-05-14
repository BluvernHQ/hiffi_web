/** Max length for playlist titles (create + rename). */
export const MAX_PLAYLIST_TITLE_LEN = 50

export const DUPLICATE_PLAYLIST_NAME_USER_MESSAGE =
  "You already have a playlist with this name."

function normalizePlaylistTitleForCompare(title: string): string {
  return title.trim().toLowerCase()
}

/** Case-insensitive match on trimmed titles; optional exclude for rename flows. */
export function hasDuplicatePlaylistTitle(
  title: string,
  playlists: { playlist_id: string; title: string }[],
  options?: { excludePlaylistId?: string },
): boolean {
  const n = normalizePlaylistTitleForCompare(title)
  if (!n) return false
  return playlists.some(
    (p) =>
      Boolean(p.playlist_id) &&
      p.playlist_id !== options?.excludePlaylistId &&
      normalizePlaylistTitleForCompare(p.title) === n,
  )
}
