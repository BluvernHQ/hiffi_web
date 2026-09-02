import type { AdminSession } from "./admin-types"

/**
 * Admin dashboard RBAC v2 — module-level permissions.
 * Backend enforces access (403); this controls nav and UI only.
 * Gate on permissions[], not role names.
 *
 * Legacy coarse keys (`analytics:read`, `users:read`, …) still work via LEGACY_GRANTS.
 */
export const PERMS = {
  // Insights — granular (preferred for role assignment)
  dashboardRead: "dashboard:read",
  dashboardWrite: "dashboard:write",
  journeysRead: "journeys:read",
  journeysWrite: "journeys:write",
  searchesRead: "searches:read",
  utmRead: "utm:read",
  utmWrite: "utm:write",
  /** @deprecated Legacy umbrella — implies all insight modules when checking access */
  analyticsRead: "analytics:read",
  analyticsWrite: "analytics:write",

  // Community & moderation — granular
  usersRead: "users:read",
  usersWrite: "users:write",
  videosRead: "videos:read",
  videosWrite: "videos:write",
  commentsRead: "comments:read",
  commentsWrite: "comments:write",
  repliesRead: "replies:read",
  repliesWrite: "replies:write",
  followersRead: "followers:read",
  referralsRead: "referrals:read",

  creatorsRead: "creators:read",
  creatorsWrite: "creators:write",

  curatedRead: "curated:read",
  curatedWrite: "curated:write",

  inventoryRead: "inventory:read",
  inventoryWrite: "inventory:write",
  inventoryClaimsRead: "inventory_claims:read",
  inventoryClaimsWrite: "inventory_claims:write",
  rankingAnomaliesRead: "ranking_anomalies:read",
  rankingAnomaliesWrite: "ranking_anomalies:write",

  flagsRead: "flags:read",
  flagsWrite: "flags:write",
  migrationRead: "migration:read",
  migrationWrite: "migration:write",

  youtubeKeysRead: "youtube_keys:read",
  youtubeKeysWrite: "youtube_keys:write",

  feedbackRead: "feedback:read",
  collaborationRead: "collaboration:read",
  discoverySourceRead: "discovery-source:read",
  discoverySourceWrite: "discovery-source:write",

  adminsRead: "admins:read",
  adminsWrite: "admins:write",
  rolesWrite: "roles:write",
} as const

export type Permission = (typeof PERMS)[keyof typeof PERMS]

const ALL_PERMISSIONS = Object.values(PERMS) as Permission[]

/** Permissions accepted by `POST/PATCH /admin/roles` (integration guide §12). */
export const BACKEND_PERMISSIONS = [
  PERMS.analyticsRead,
  PERMS.analyticsWrite,
  PERMS.usersRead,
  PERMS.usersWrite,
  PERMS.creatorsRead,
  PERMS.creatorsWrite,
  PERMS.curatedRead,
  PERMS.curatedWrite,
  PERMS.inventoryRead,
  PERMS.inventoryWrite,
  PERMS.flagsRead,
  PERMS.flagsWrite,
  PERMS.migrationRead,
  PERMS.migrationWrite,
  PERMS.youtubeKeysRead,
  PERMS.youtubeKeysWrite,
  PERMS.feedbackRead,
  PERMS.collaborationRead,
  PERMS.adminsRead,
  PERMS.adminsWrite,
  PERMS.rolesWrite,
] as const

export type BackendPermission = (typeof BACKEND_PERMISSIONS)[number]

const BACKEND_PERMISSION_SET = new Set<string>(BACKEND_PERMISSIONS)

export function isBackendPermission(value: string): value is BackendPermission {
  return BACKEND_PERMISSION_SET.has(value)
}

export const INSIGHTS_READ_MODULES: Permission[] = [
  PERMS.dashboardRead,
  PERMS.journeysRead,
  PERMS.searchesRead,
  PERMS.utmRead,
]

export const INSIGHTS_WRITE_MODULES: Permission[] = [
  PERMS.dashboardWrite,
  PERMS.journeysWrite,
  PERMS.utmWrite,
]

export const USERS_CONTENT_READ_MODULES: Permission[] = [
  PERMS.usersRead,
  PERMS.videosRead,
  PERMS.commentsRead,
  PERMS.repliesRead,
  PERMS.followersRead,
  PERMS.referralsRead,
]

export const USERS_CONTENT_WRITE_MODULES: Permission[] = [
  PERMS.usersWrite,
  PERMS.videosWrite,
  PERMS.commentsWrite,
  PERMS.repliesWrite,
]

export const INVENTORY_READ_MODULES: Permission[] = [
  PERMS.inventoryRead,
  PERMS.inventoryClaimsRead,
  PERMS.rankingAnomaliesRead,
]

export const INVENTORY_WRITE_MODULES: Permission[] = [
  PERMS.inventoryWrite,
  PERMS.inventoryClaimsWrite,
  PERMS.rankingAnomaliesWrite,
]

/** Granular permission implied by a legacy coarse grant on the session. */
const LEGACY_GRANTS: Partial<Record<Permission, readonly Permission[]>> = {
  [PERMS.dashboardRead]: [PERMS.analyticsRead],
  [PERMS.dashboardWrite]: [PERMS.analyticsWrite],
  [PERMS.journeysRead]: [PERMS.analyticsRead],
  [PERMS.journeysWrite]: [PERMS.analyticsWrite],
  [PERMS.searchesRead]: [PERMS.analyticsRead],
  [PERMS.utmRead]: [PERMS.analyticsRead],
  [PERMS.utmWrite]: [PERMS.analyticsWrite],

  [PERMS.videosRead]: [PERMS.usersRead],
  [PERMS.videosWrite]: [PERMS.usersWrite],
  [PERMS.commentsRead]: [PERMS.usersRead],
  [PERMS.commentsWrite]: [PERMS.usersWrite],
  [PERMS.repliesRead]: [PERMS.usersRead],
  [PERMS.repliesWrite]: [PERMS.usersWrite],
  [PERMS.followersRead]: [PERMS.usersRead],
  [PERMS.referralsRead]: [PERMS.usersRead],

  [PERMS.inventoryClaimsRead]: [PERMS.inventoryRead],
  [PERMS.inventoryClaimsWrite]: [PERMS.inventoryWrite],
  [PERMS.rankingAnomaliesRead]: [PERMS.inventoryRead],
  [PERMS.rankingAnomaliesWrite]: [PERMS.inventoryWrite],

  [PERMS.discoverySourceWrite]: [PERMS.adminsWrite],
}

const LEGACY_UMBRELLA_CHECKS: Partial<
  Record<Permission, readonly Permission[]>
> = {
  [PERMS.analyticsRead]: INSIGHTS_READ_MODULES,
  [PERMS.analyticsWrite]: INSIGHTS_WRITE_MODULES,
  [PERMS.usersRead]: USERS_CONTENT_READ_MODULES,
  [PERMS.usersWrite]: USERS_CONTENT_WRITE_MODULES,
  [PERMS.inventoryRead]: INVENTORY_READ_MODULES,
  [PERMS.inventoryWrite]: INVENTORY_WRITE_MODULES,
}

/**
 * Collapse module-level UI selections into backend role API permission strings.
 * The backend does not yet accept granular keys like `dashboard:read`.
 */
export function compressPermissionsForBackend(
  selected: Permission[],
): BackendPermission[] {
  const out = new Set<BackendPermission>()

  const hasAny = (mods: readonly Permission[]) =>
    mods.some((m) => selected.includes(m))

  if (hasAny(INSIGHTS_READ_MODULES)) out.add(PERMS.analyticsRead)
  if (hasAny(INSIGHTS_WRITE_MODULES)) out.add(PERMS.analyticsWrite)

  if (hasAny(USERS_CONTENT_READ_MODULES)) out.add(PERMS.usersRead)
  if (hasAny(USERS_CONTENT_WRITE_MODULES)) out.add(PERMS.usersWrite)

  if (hasAny(INVENTORY_READ_MODULES)) out.add(PERMS.inventoryRead)
  if (hasAny(INVENTORY_WRITE_MODULES)) out.add(PERMS.inventoryWrite)

  const passthrough: BackendPermission[] = [
    PERMS.creatorsRead,
    PERMS.creatorsWrite,
    PERMS.curatedRead,
    PERMS.curatedWrite,
    PERMS.flagsRead,
    PERMS.flagsWrite,
    PERMS.migrationRead,
    PERMS.migrationWrite,
    PERMS.youtubeKeysRead,
    PERMS.youtubeKeysWrite,
    PERMS.feedbackRead,
    PERMS.collaborationRead,
    PERMS.adminsRead,
    PERMS.adminsWrite,
    PERMS.rolesWrite,
  ]

  for (const p of passthrough) {
    if (selected.includes(p)) out.add(p)
  }

  // Frontend extension — backend has no discovery-source keys yet.
  if (hasAny([PERMS.discoverySourceRead, PERMS.discoverySourceWrite])) {
    out.add(PERMS.adminsRead)
  }
  if (selected.includes(PERMS.discoverySourceWrite)) {
    out.add(PERMS.adminsWrite)
  }

  return [...out]
}

/** Expand legacy umbrella permissions for role editor display. */
export function expandLegacyPermissions(permissions: string[]): Permission[] {
  const set = new Set<string>(permissions)
  for (const [umbrella, modules] of Object.entries(LEGACY_UMBRELLA_CHECKS)) {
    if (set.has(umbrella)) {
      for (const mod of modules) set.add(mod)
    }
  }
  return [...set] as Permission[]
}

export function hasPermission(
  permissions: string[] | undefined,
  perm: Permission,
): boolean {
  if (!permissions?.length) return false
  if (permissions.includes(perm)) return true

  const legacy = LEGACY_GRANTS[perm]
  if (legacy?.some((p) => permissions.includes(p))) return true

  const umbrellaModules = LEGACY_UMBRELLA_CHECKS[perm]
  if (umbrellaModules?.some((m) => permissions.includes(m))) return true

  return false
}

export function hasAnyPermission(
  permissions: string[] | undefined,
  perms: Permission[],
): boolean {
  return perms.some((p) => hasPermission(permissions, p))
}

/** Fallback for sessions stored before RBAC v2 (no permissions[] in localStorage). */
function derivePermissionsFromRole(role: string): Permission[] {
  switch (role) {
    case "super_admin":
      return ALL_PERMISSIONS
    case "read_only":
      return ALL_PERMISSIONS.filter((p) => p.endsWith(":read"))
    case "curator":
      return [PERMS.curatedRead, PERMS.curatedWrite]
    case "support":
      return [
        PERMS.usersRead,
        PERMS.videosRead,
        PERMS.commentsRead,
        PERMS.repliesRead,
        PERMS.followersRead,
        PERMS.referralsRead,
        PERMS.creatorsRead,
        PERMS.feedbackRead,
        PERMS.collaborationRead,
        PERMS.flagsRead,
        PERMS.migrationRead,
      ]
    case "inventory_ops":
      return [
        PERMS.inventoryRead,
        PERMS.inventoryWrite,
        PERMS.inventoryClaimsRead,
        PERMS.inventoryClaimsWrite,
        PERMS.rankingAnomaliesRead,
        PERMS.rankingAnomaliesWrite,
      ]
    case "platform_ops":
      return [
        ...INSIGHTS_READ_MODULES,
        ...INSIGHTS_WRITE_MODULES,
        PERMS.usersRead,
        PERMS.usersWrite,
        PERMS.videosRead,
        PERMS.videosWrite,
        PERMS.commentsRead,
        PERMS.commentsWrite,
        PERMS.repliesRead,
        PERMS.repliesWrite,
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

export function adminCan(admin: AdminSession | null | undefined, permission: Permission): boolean {
  return hasPermission(getEffectivePermissions(admin), permission)
}

export const ADMIN_SECTION_PERMISSION: Record<string, Permission> = {
  overview: PERMS.dashboardRead,
  users: PERMS.usersRead,
  videos: PERMS.videosRead,
  comments: PERMS.commentsRead,
  replies: PERMS.repliesRead,
  flags: PERMS.flagsRead,
  feedback: PERMS.feedbackRead,
  activity: PERMS.journeysRead,
  journeys: PERMS.journeysRead,
  referrals: PERMS.referralsRead,
  followers: PERMS.followersRead,
  searches: PERMS.searchesRead,
  utm_polls: PERMS.utmRead,
  collaboration: PERMS.collaborationRead,
  discovery_source: PERMS.discoverySourceRead,
  migrations: PERMS.migrationRead,
  curated_playlists: PERMS.curatedRead,
  admins: PERMS.adminsRead,
  admin_roles: PERMS.rolesWrite,
  artist_inventory: PERMS.inventoryRead,
  ranking_anomalies: PERMS.rankingAnomaliesRead,
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
