/** Backend user roles (see lib/ADMIN_API.md). */
export type UserRole = "user" | "creator" | "admin"

export type UserLike = {
  role?: unknown
  is_creator?: boolean
} | null | undefined

export function normalizeRole(role: unknown): UserRole {
  const r = String(role ?? "user").toLowerCase().trim()
  if (r === "admin" || r === "creator") return r
  return "user"
}

/** Effective role for authorization — admin wins over creator; legacy `is_creator` promotes to creator. */
export function getEffectiveRole(user: UserLike): UserRole {
  if (!user) return "user"
  const role = normalizeRole(user.role)
  if (role === "admin") return "admin"
  if (role === "creator" || user.is_creator === true) return "creator"
  return "user"
}

/** @deprecated Admin accounts are separate from consumer users. Use admin dashboard auth instead. */
export function isAdmin(user: UserLike): boolean {
  return getEffectiveRole(user) === "admin"
}

export function isCreator(user: UserLike): boolean {
  const role = getEffectiveRole(user)
  return role === "creator" || role === "admin"
}

export function hasRole(user: UserLike, ...roles: UserRole[]): boolean {
  const effective = getEffectiveRole(user)
  return roles.includes(effective)
}
