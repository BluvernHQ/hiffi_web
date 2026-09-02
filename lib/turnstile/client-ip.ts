/** Best-effort client IP for Turnstile siteverify (optional). */
export function getClientIpFromRequest(request: Request): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  if (forwarded) return forwarded
  const realIp = request.headers.get("x-real-ip")?.trim()
  return realIp || undefined
}
