/**
 * User JWT from a same-origin request.
 * Clients send `X-Hiffi-Authorization` so nginx Basic Auth on staging
 * (which uses the standard `Authorization` header) is not overwritten.
 * `Authorization` is still accepted for older clients.
 */
export function incomingAuthHeader(request: { headers: Headers }): string | null {
  const value =
    request.headers.get("x-hiffi-authorization")?.trim() ||
    request.headers.get("authorization")?.trim() ||
    ""
  return value || null
}
