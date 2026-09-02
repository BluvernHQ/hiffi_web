/** Public Turnstile site key (safe for the browser). */
export function getTurnstileSiteKey(): string {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || ""
}

/** Hostnames where Turnstile may run during `next dev` (must be allowlisted in Cloudflare). */
function isLocalTurnstileHost(): boolean {
  if (typeof window === "undefined") return false
  const host = window.location.hostname
  return host === "localhost" || host === "127.0.0.1"
}

/**
 * True when the widget should render and forms must obtain a token before submit.
 *
 * Production / `next start`: on when a site key is configured.
 * `next dev`: on for localhost / 127.0.0.1 (after Cloudflare allowlist), or when
 * `NEXT_PUBLIC_TURNSTILE_FORCE=true` for other dev hostnames (e.g. LAN IP).
 */
export function isTurnstileEnabled(): boolean {
  if (!getTurnstileSiteKey()) return false
  if (process.env.NEXT_PUBLIC_TURNSTILE_FORCE === "true") return true
  if (process.env.NODE_ENV === "development") return isLocalTurnstileHost()
  return true
}

/** True when the Next.js BFF must verify Turnstile before forwarding public form posts. */
export function isTurnstileRequiredOnServer(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY?.trim())
}
