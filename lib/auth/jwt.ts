export type JwtPayload = {
  principal_type?: string
  uid?: string
  admin_id?: string
  role?: string
  exp?: number
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".")
    if (parts.length < 2) return null
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4)
    const json = atob(padded)
    return JSON.parse(json) as JwtPayload
  } catch {
    return null
  }
}

export function isAdminJwt(token: string): boolean {
  const payload = decodeJwtPayload(token)
  if (!payload) return false
  if (payload.principal_type === "admin") return true
  // Legacy tokens without principal_type are user tokens
  return false
}

export function isJwtExpired(token: string): boolean {
  const payload = decodeJwtPayload(token)
  if (!payload?.exp) return false
  return Date.now() >= payload.exp * 1000
}
