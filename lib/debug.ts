const enabled =
  process.env.NEXT_PUBLIC_DEBUG_LOGS === "1" ||
  process.env.NEXT_PUBLIC_DEBUG_LOGS === "true"

export function debugLog(...args: unknown[]) {
  if (!enabled) return
  // eslint-disable-next-line no-console
  console.log(...args)
}

export function debugWarn(...args: unknown[]) {
  if (!enabled) return
  // eslint-disable-next-line no-console
  console.warn(...args)
}

