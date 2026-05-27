/** Max length for playlist titles (create + rename). */
export const MAX_PLAYLIST_TITLE_LEN = 50

export const PLAYLIST_TITLE_REQUIRED_MESSAGE = "Title is required"
export const PLAYLIST_TITLE_MAX_MESSAGE = `Maximum ${MAX_PLAYLIST_TITLE_LEN} characters allowed`

export const DUPLICATE_PLAYLIST_NAME_USER_MESSAGE =
  "You already have a playlist with this name."

/** Live feedback while typing (raw length, not trimmed). */
export function getPlaylistTitleLengthError(title: string): string | null {
  if (title.length > MAX_PLAYLIST_TITLE_LEN) return PLAYLIST_TITLE_MAX_MESSAGE
  return null
}

export function getPlaylistTitleValidationError(title: string): string | null {
  const lengthError = getPlaylistTitleLengthError(title)
  if (lengthError) return lengthError
  const t = title.trim()
  if (!t) return PLAYLIST_TITLE_REQUIRED_MESSAGE
  return null
}

/** Update inline title error as the user types (max length is immediate). */
export function resolvePlaylistTitleErrorOnChange(
  value: string,
  previousError: string,
): string {
  const lengthError = getPlaylistTitleLengthError(value)
  if (lengthError) return lengthError
  if (previousError === PLAYLIST_TITLE_MAX_MESSAGE) return ""
  if (previousError === PLAYLIST_TITLE_REQUIRED_MESSAGE && value.trim().length > 0) return ""
  return previousError
}

/** Map API validation messages to inline field errors when possible. */
export function parsePlaylistMetadataApiFieldErrors(message: string): {
  title?: string
  description?: string
} {
  const lower = message.toLowerCase()
  const maxMatch = message.match(/(\d+)\s*characters?/i)
  const maxMessage = maxMatch ? `Maximum ${maxMatch[1]} characters allowed` : null

  if (/title/i.test(lower) && /(too long|exceed|maximum|max\s)/i.test(lower)) {
    return { title: maxMessage || PLAYLIST_TITLE_MAX_MESSAGE }
  }
  if (/description/i.test(lower) && /(too long|exceed|maximum|max\s)/i.test(lower)) {
    return { description: maxMessage || "Description is too long" }
  }
  if (/title/i.test(lower) && /(required|empty|missing)/i.test(lower)) {
    return { title: PLAYLIST_TITLE_REQUIRED_MESSAGE }
  }
  return {}
}

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
