const MAX_SEARCH_QUERY_LEN = 500

/** Escape dynamic string before embedding in `RegExp` (prevents crash on `*`, `(`, etc.). */
export function escapeRegExp(s: string): string {
  return s.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&")
}

export function normalizeSearchQueryForRequest(raw: string): string {
  return raw.replace(/\0/g, "").trim().slice(0, MAX_SEARCH_QUERY_LEN)
}

/** Block obvious SQL / script injection-style probes from being sent as search text. */
export function isSuspiciousSqlLikeQuery(q: string): boolean {
  const s = q.toLowerCase()
  return /(\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b|\btruncate\b|\bunion\b\s+\bselect\b|\bexec\b|\bexecute\b|--|\/\*)/i.test(
    s,
  )
}

/** Case-insensitive highlight segments — avoids building `RegExp` from raw query (special chars safe). */
export function highlightParts(text: string, needle: string): { text: string; hit: boolean }[] {
  const n = needle.trim()
  if (!n || !text) return [{ text, hit: false }]
  const low = text.toLowerCase()
  const nl = n.toLowerCase()
  const out: { text: string; hit: boolean }[] = []
  let start = 0
  let idx = low.indexOf(nl, start)
  while (idx !== -1) {
    if (idx > start) out.push({ text: text.slice(start, idx), hit: false })
    out.push({ text: text.slice(idx, idx + n.length), hit: true })
    start = idx + n.length
    idx = low.indexOf(nl, start)
  }
  if (start < text.length) out.push({ text: text.slice(start), hit: false })
  return out
}
