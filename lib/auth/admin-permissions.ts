import type { AdminSession } from "./admin-types"

/**
 * Admin dashboard RBAC v2. Backend enforces access (403); this controls nav and UI only.
 * Gate on permissions[], not role names.
 */
export const PERMS = {
  analyticsRead: "analytics:read",
  analyticsWrite: "analytics:write",
  usersRead: "users:read",
  usersWrite: "users:write",
  creatorsRead: "creators:read",
  creatorsWrite: "creators:write",
  curatedRead: "curated:read",
  curatedWrite: "curated:write",
  inventoryRead: "inventory:read",
  inventoryWrite: "inventory:write",
  flagsRead: "flags:read",
  flagsWrite: "flags:write",
  migrationRead: "migration:read",
  migrationWrite: "migration:write",
  youtubeKeysRead: "youtube_keys:read",
  youtubeKeysWrite: "youtube_keys:write",
  feedbackRead: "feedback:read",
  collaborationRead: "collaboration:read",
  discoverySourceRead: "discovery-source:read",
  adminsRead: "admins:read",
  adminsWrite: "admins:write",
  rolesWrite: "roles:write",
} as const

export type Permission = (typeof PERMS)[keyof typeof PERMS]

const ALL_PERMISSIONS = Object.values(PERMS) as Permission[]
const ALL_READ_PERMISSIONS = ALL_PERMISSIONS.filter((p) => p.endsWith(":read"))

/** Fallback for sessions stored before RBAC v2 (no permissions[] in localStorage). */
function derivePermissionsFromRole(role: string): Permission[] {
  switch (role) {
    case "super_admin":
      return ALL_PERMISSIONS
    case "read_only":
      return ALL_READ_PERMISSIONS
    case "curator":
      return [PERMS.curatedRead, PERMS.curatedWrite]
    case "support":
      return [
        PERMS.usersRead,
        PERMS.creatorsRead,
        PERMS.feedbackRead,
        PERMS.collaborationRead,
        PERMS.discoverySourceRead,
        PERMS.flagsRead,
        PERMS.migrationRead,
      ]
    case "inventory_ops":
      return [PERMS.inventoryRead, PERMS.inventoryWrite]
    case "platform_ops":
      return [
        PERMS.analyticsRead,
        PERMS.analyticsWrite,
        PERMS.usersRead,
        PERMS.usersWrite,
        PERMS.creatorsRead,
        PERMS.creatorsWrite,
        PERMS.flagsRead,
        PERMS.flagsWrite,
        PERMS.migrationRead,
        PERMS.migrationWrite,
      ]
    default:
      return []
  }
}

export function getEffectivePermissions(admin: AdminSession | null | undefined): Permission[] {
  if (!admin) return []
  if (admin.permissions?.length) return admin.permissions as Permission[]
  return derivePermissionsFromRole(admin.role)
}

export function hasPermission(
  permissions: string[] | undefined,
  perm: Permission,
): boolean {
  return permissions?.includes(perm) ?? false
}

export function hasAnyPermission(
  permissions: string[] | undefined,
  perms: Permission[],
): boolean {
  return perms.some((p) => hasPermission(permissions, p))
}

export function adminCan(admin: AdminSession | null | undefined, permission: Permission): boolean {
  return hasPermission(getEffectivePermissions(admin), permission)
}

export const ADMIN_SECTION_PERMISSION: Record<string, Permission> = {
  overview: PERMS.analyticsRead,
  users: PERMS.usersRead,
  videos: PERMS.usersRead,
  comments: PERMS.usersRead,
  replies: PERMS.usersRead,
  flags: PERMS.flagsRead,
  feedback: PERMS.feedbackRead,
  activity: PERMS.analyticsRead,
  journeys: PERMS.analyticsRead,
  referrals: PERMS.usersRead,
  followers: PERMS.usersRead,
  searches: PERMS.analyticsRead,
  utm_polls: PERMS.analyticsRead,
  collaboration: PERMS.collaborationRead,
  discovery_source: PERMS.discoverySourceRead,
  migrations: PERMS.migrationRead,
  curated_playlists: PERMS.curatedRead,
  admins: PERMS.adminsRead,
  artist_inventory: PERMS.inventoryRead,
  ranking_anomalies: PERMS.inventoryRead,
  creators: PERMS.creatorsRead,
  tools: PERMS.youtubeKeysRead,
}

export function canAccessAdminSection(admin: AdminSession | null | undefined, section: string): boolean {
  if (!admin) return false
  const permission = ADMIN_SECTION_PERMISSION[section]
  if (!permission) return getEffectivePermissions(admin).length > 0
  return adminCan(admin, permission)
}

export function getFirstAllowedSection(admin: AdminSession): string {
  for (const [section, permission] of Object.entries(ADMIN_SECTION_PERMISSION)) {
    if (adminCan(admin, permission)) return section
  }
  return "overview"
}

export function getDefaultSectionForAdmin(admin: AdminSession): string {
  return getFirstAllowedSection(admin)
}
