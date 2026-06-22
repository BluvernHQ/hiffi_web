import { getEffectiveRole, type UserLike, type UserRole } from "./roles"

/**
 * Permission keys for RBAC. Backend still enforces admin APIs (403).
 * Frontend matrix controls navigation and UI visibility only.
 */
export const PERMISSIONS = {
  "admin:access": ["admin"],
  "admin:overview": ["admin"],
  "admin:users": ["admin"],
  "admin:videos": ["admin"],
  "admin:comments": ["admin"],
  "admin:replies": ["admin"],
  "admin:flags": ["admin"],
  "admin:activity": ["admin"],
  "admin:referrals": ["admin"],
  "admin:followers": ["admin"],
  "admin:searches": ["admin"],
  "admin:utm": ["admin"],
  "admin:migrations": ["admin"],
  "creator:upload": ["creator"],
  "creator:studio": ["creator"],
} as const satisfies Record<string, readonly UserRole[]>

export type Permission = keyof typeof PERMISSIONS

export function can(user: UserLike, permission: Permission): boolean {
  const role = getEffectiveRole(user)
  const allowed = PERMISSIONS[permission] as readonly UserRole[]
  return allowed.includes(role)
}

/** Map admin dashboard `?section=` values to permissions. */
export const ADMIN_SECTION_PERMISSION: Record<string, Permission> = {
  overview: "admin:overview",
  users: "admin:users",
  videos: "admin:videos",
  comments: "admin:comments",
  replies: "admin:replies",
  flags: "admin:flags",
  activity: "admin:activity",
  referrals: "admin:referrals",
  followers: "admin:followers",
  searches: "admin:searches",
  utm_polls: "admin:utm",
  migrations: "admin:migrations",
}

export function canAccessAdminSection(user: UserLike, section: string): boolean {
  const permission = ADMIN_SECTION_PERMISSION[section]
  if (!permission) return can(user, "admin:access")
  return can(user, permission)
}
