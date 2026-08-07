/** Official store listings for the Hiffi mobile app (used on /app, footer, and JSON-LD). */
export const HIFFI_APP_STORE_URL =
  "https://apps.apple.com/us/app/hiffi/id6759672725" as const
export const HIFFI_PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.hiffi.app" as const

/** Canonical store URLs for Organization sameAs / entity linking. */
export const HIFFI_STORE_SAME_AS = [HIFFI_APP_STORE_URL, HIFFI_PLAY_STORE_URL] as const
