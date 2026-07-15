import type { AdminRole, AdminSession } from "./admin-types"

/**
 * Admin dashboard RBAC. Backend enforces access (403); this controls nav and UI only.
 */
export const ADMIN_PERMISSIONS = {
  "admin:access": ["super_admin", "read_only"],
  "admin:overview": ["super_admin", "read_only"],
  "admin:users": ["super_admin", "read_only"],
  "admin:videos": ["super_admin", "read_only"],
  "admin:comments": ["super_admin", "read_only"],
  "admin:replies": ["super_admin", "read_only"],
  "admin:flags": ["super_admin", "read_only"],
  "admin:feedback": ["super_admin", "read_only"],
  "admin:activity": ["super_admin", "read_only"],
  "admin:referrals": ["super_admin", "read_only"],
  "admin:followers": ["super_admin", "read_only"],
  "admin:searches": ["super_admin", "read_only"],
  "admin:utm": ["super_admin", "read_only"],
  "admin:collaboration": ["super_admin", "read_only"],
  "admin:migrations": ["super_admin", "read_only"],
  "admin:write": ["super_admin"],
  "admin:curated": ["super_admin", "curator"],
  "admin:curated_write": ["super_admin", "curator"],
  "admin:admins": ["super_admin"],
  "admin:inventory": ["super_admin", "read_only"],
  "admin:inventory_upload": ["super_admin"],
  "admin:inventory_claims": ["super_admin", "read_only"],
} as const satisfies Record<string, readonly AdminRole[]>

export type AdminPermission = keyof typeof ADMIN_PERMISSIONS

export function adminCan(admin: AdminSession | null | undefined, permission: AdminPermission): boolean {
  if (!admin) return false
  const allowed = ADMIN_PERMISSIONS[permission] as readonly AdminRole[]
  return allowed.includes(admin.role)
}

export function adminCanWrite(admin: AdminSession | null | undefined): boolean {
  return adminCan(admin, "admin:write")
}

export function adminCanCurate(admin: AdminSession | null | undefined): boolean {
  return adminCan(admin, "admin:curated_write")
}

export function isCuratorOnlyAdmin(admin: AdminSession | null | undefined): boolean {
  return admin?.role === "curator"
}

export const ADMIN_SECTION_PERMISSION: Record<string, AdminPermission> = {
  overview: "admin:overview",
  users: "admin:users",
  videos: "admin:videos",
  comments: "admin:comments",
  replies: "admin:replies",
  flags: "admin:flags",
  feedback: "admin:feedback",
  activity: "admin:activity",
  referrals: "admin:referrals",
  followers: "admin:followers",
  searches: "admin:searches",
  utm_polls: "admin:utm",
  collaboration: "admin:collaboration",
  migrations: "admin:migrations",
  curated_playlists: "admin:curated",
  admins: "admin:admins",
  artist_inventory: "admin:inventory",
}

export function canAccessAdminSection(admin: AdminSession | null | undefined, section: string): boolean {
  if (!admin) return false
  if (admin.role === "curator") {
    return section === "curated_playlists"
  }
  const permission = ADMIN_SECTION_PERMISSION[section]
  if (!permission) return adminCan(admin, "admin:access")
  return adminCan(admin, permission)
}

export function getDefaultSectionForAdmin(admin: AdminSession): string {
  if (admin.role === "curator") return "curated_playlists"
  return "overview"
}

export function getFirstAllowedSection(admin: AdminSession): string {
  if (admin.role === "curator") return "curated_playlists"
  for (const [section, permission] of Object.entries(ADMIN_SECTION_PERMISSION)) {
    if (adminCan(admin, permission)) return section
  }
  return "overview"
}
