type Entry<T> = { freshUntil: number; value: Promise<T> }

const RETRY_AFTER_FAILURE_MS = 30_000

/**
 * Per-process cache that only makes a caller wait on the very first load for a key. Once a value
 * exists, expired reads return it immediately and refresh in the background; a failed refresh
 * keeps serving the last good value. Failed first loads are dropped so the next call retries.
 */
export function createStaleWhileRevalidate<T>(ttlMs: number, onError: (error: unknown, key: string) => void) {
  const entries = new Map<string, Entry<T>>()

  return function read(key: string, load: () => Promise<T>): Promise<T> {
    const now = Date.now()
    const entry = entries.get(key)
    if (entry && entry.freshUntil > now) return entry.value

    const next = load()

    if (!entry) {
      entries.set(key, { freshUntil: now + ttlMs, value: next })
      next.catch((error) => {
        onError(error, key)
        if (entries.get(key)?.value === next) entries.delete(key)
      })
      return next
    }

    entry.freshUntil = now + ttlMs
    next.then(
      () => entries.set(key, { freshUntil: Date.now() + ttlMs, value: next }),
      (error) => {
        onError(error, key)
        entry.freshUntil = Date.now() + RETRY_AFTER_FAILURE_MS
      },
    )
    return entry.value
  }
}
