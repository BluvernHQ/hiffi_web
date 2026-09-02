/** Public Turnstile site key (safe for the browser). */
export function getTurnstileSiteKey(): string {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || ""
}

/**
 * True when the widget should render and forms must obtain a token before submit.
 *
 * Production / `next start`: on when a site key is configured.
 * `next dev`: off on localhost and all dev hostnames unless
 * `NEXT_PUBLIC_TURNSTILE_FORCE=true`.
 */
export function isTurnstileEnabled(): boolean {
  if (!getTurnstileSiteKey()) return false
  if (process.env.NEXT_PUBLIC_TURNSTILE_FORCE === "true") return true
  if (process.env.NODE_ENV === "development") return false
  return true
}

/** True when the Next.js BFF must verify Turnstile before forwarding public form posts. */
export function isTurnstileRequiredOnServer(): boolean {
  if (!process.env.TURNSTILE_SECRET_KEY?.trim()) return false
  if (process.env.NEXT_PUBLIC_TURNSTILE_FORCE === "true") return true
  if (process.env.NODE_ENV === "development") return false
  return true
}
