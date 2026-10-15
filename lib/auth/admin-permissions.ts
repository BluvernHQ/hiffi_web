import type { AdminSession } from "./admin-types"

/**
 * Admin dashboard RBAC v2 — sub-feature permissions (`module.subfeature:action`).
 * Backend enforces access (403); this controls nav and UI only.
 * Gate on permissions[], not role names.
 */
export const PERMS = {
  adminsAccountsRead: "admins.accounts:read",
  adminsAccountsWrite: "admins.accounts:write",
  rolesManagementRead: "roles.management:read",
  rolesManagementWrite: "roles.management:write",
  usersBrowseRead: "users.browse:read",
  usersModerationWrite: "users.moderation:write",
  analyticsCountersRead: "analytics.counters:read",
  analyticsCountersWrite: "analytics.counters:write",
  analyticsJourneysRead: "analytics.journeys:read",
  analyticsJourneysWrite: "analytics.journeys:write",
  analyticsUtmRead: "analytics.utm:read",
  analyticsUtmWrite: "analytics.utm:write",
  analyticsSearchesRead: "analytics.searches:read",
  creatorsDashboardRead: "creators.dashboard:read",
  creatorsModerationWrite: "creators.moderation:write",
  curatedPlaylistsRead: "curated.playlists:read",
  curatedPlaylistsWrite: "curated.playlists:write",
  flagsReviewRead: "flags.review:read",
  flagsReviewWrite: "flags.review:write",
  migrationRequestsRead: "migration.requests:read",
  migrationRequestsWrite: "migration.requests:write",
  collaborationInquiriesRead: "collaboration.inquiries:read",
  feedbackInboxRead: "feedback.inbox:read",
  inventoryArtistsRead: "inventory.artists:read",
  inventoryArtistsWrite: "inventory.artists:write",
  inventoryClaimsRead: "inventory.claims:read",
  inventoryClaimsWrite: "inventory.claims:write",
  inventoryRankingRead: "inventory.ranking:read",
  inventoryRankingWrite: "inventory.ranking:write",
  youtubeKeysManageRead: "youtube_keys.manage:read",
  youtubeKeysManageWrite: "youtube_keys.manage:write",
} as const

export type Permission = (typeof PERMS)[keyof typeof PERMS]

export const ALL_PERMISSIONS = Object.values(PERMS) as Permission[]

const PERMISSION_SET = new Set<string>(ALL_PERMISSIONS)

export function isKnownPermission(value: string): value is Permission {
  return PERMISSION_SET.has(value)
}

/** Permissions accepted by `POST/PATCH /admin/roles`. */
export const BACKEND_PERMISSIONS = ALL_PERMISSIONS

export type BackendPermission = Permission

export function isBackendPermission(value: string): value is BackendPermission {
  return isKnownPermission(value)
}

const ANALYTICS_READ: Permission[] = [
  PERMS.analyticsCountersRead,
  PERMS.analyticsJourneysRead,
  PERMS.analyticsUtmRead,
  PERMS.analyticsSearchesRead,
]

const ANALYTICS_WRITE: Permission[] = [
  PERMS.analyticsCountersWrite,
  PERMS.analyticsJourneysWrite,
  PERMS.analyticsUtmWrite,
]

const INVENTORY_READ: Permission[] = [
  PERMS.inventoryArtistsRead,
  PERMS.inventoryClaimsRead,
  PERMS.inventoryRankingRead,
]

const INVENTORY_WRITE: Permission[] = [
  PERMS.inventoryArtistsWrite,
  PERMS.inventoryClaimsWrite,
  PERMS.inventoryRankingWrite,
]

/** Legacy session / role keys that satisfy a v2 permission check. */
const LEGACY_GRANTS: Partial<Record<Permission, readonly string[]>> = {
  [PERMS.analyticsCountersRead]: [
    "analytics:read",
    "dashboard:read",
    "analytics.counters:read",
  ],
  [PERMS.analyticsCountersWrite]: [
    "analytics:write",
    "dashboard:write",
    "analytics.counters:write",
  ],
  [PERMS.analyticsJourneysRead]: [
    "analytics:read",
    "journeys:read",
    "analytics.journeys:read",
  ],
  [PERMS.analyticsJourneysWrite]: [
    "analytics:write",
    "journeys:write",
    "analytics.journeys:write",
  ],
  [PERMS.analyticsSearchesRead]: ["analytics:read", "searches:read", "analytics.searches:read"],
  [PERMS.analyticsUtmRead]: ["analytics:read", "utm:read", "analytics.utm:read"],
  [PERMS.analyticsUtmWrite]: ["analytics:write", "utm:write", "analytics.utm:write"],

  [PERMS.usersBrowseRead]: [
    "users:read",
    "users.browse:read",
    "videos:read",
    "comments:read",
    "replies:read",
    "followers:read",
    "referrals:read",
  ],
  [PERMS.usersModerationWrite]: [
    "users:write",
    "users.moderation:write",
    "videos:write",
    "comments:write",
    "replies:write",
  ],

  [PERMS.creatorsDashboardRead]: ["creators:read", "creators.dashboard:read"],
  [PERMS.creatorsModerationWrite]: ["creators:write", "creators.moderation:write"],

  [PERMS.curatedPlaylistsRead]: ["curated:read", "curated.playlists:read"],
  [PERMS.curatedPlaylistsWrite]: ["curated:write", "curated.playlists:write"],

  [PERMS.inventoryArtistsRead]: ["inventory:read", "inventory.artists:read"],
  [PERMS.inventoryArtistsWrite]: ["inventory:write", "inventory.artists:write"],
  [PERMS.inventoryClaimsRead]: [
    "inventory:read",
    "inventory_claims:read",
    "inventory.claims:read",
  ],
  [PERMS.inventoryClaimsWrite]: [
    "inventory:write",
    "inventory_claims:write",
    "inventory.claims:write",
  ],
  [PERMS.inventoryRankingRead]: [
    "inventory:read",
    "ranking_anomalies:read",
    "inventory.ranking:read",
  ],
  [PERMS.inventoryRankingWrite]: [
    "inventory:write",
    "ranking_anomalies:write",
    "inventory.ranking:write",
  ],

  [PERMS.flagsReviewRead]: ["flags:read", "flags.review:read"],
  [PERMS.flagsReviewWrite]: ["flags:write", "flags.review:write"],
  [PERMS.migrationRequestsRead]: ["migration:read", "migration.requests:read"],
  [PERMS.migrationRequestsWrite]: ["migration:write", "migration.requests:write"],
  [PERMS.feedbackInboxRead]: ["feedback:read", "feedback.inbox:read"],
  [PERMS.collaborationInquiriesRead]: [
    "collaboration:read",
    "collaboration.inquiries:read",
  ],

  [PERMS.youtubeKeysManageRead]: ["youtube_keys:read", "youtube_keys.manage:read"],
  [PERMS.youtubeKeysManageWrite]: ["youtube_keys:write", "youtube_keys.manage:write"],
  [PERMS.adminsAccountsRead]: [
    "admins:read",
    "admins.accounts:read",
    "discovery-source:read",
  ],
  [PERMS.adminsAccountsWrite]: [
    "admins:write",
    "admins.accounts:write",
    "discovery-source:write",
  ],
  [PERMS.rolesManagementRead]: ["roles.management:read", "roles:write", "roles.management:write"],
  [PERMS.rolesManagementWrite]: ["roles:write", "roles.management:write"],
}

/** Legacy umbrella keys expanded to v2 permissions (role editor display). */
const LEGACY_EXPANSIONS: Record<string, readonly Permission[]> = {
  "analytics:read": ANALYTICS_READ,
  "analytics:write": ANALYTICS_WRITE,
  "users:read": [PERMS.usersBrowseRead],
  "users:write": [PERMS.usersModerationWrite],
  "inventory:read": INVENTORY_READ,
  "inventory:write": INVENTORY_WRITE,
  "dashboard:read": [PERMS.analyticsCountersRead],
  "dashboard:write": [PERMS.analyticsCountersWrite],
  "journeys:read": [PERMS.analyticsJourneysRead],
  "journeys:write": [PERMS.analyticsJourneysWrite],
  "searches:read": [PERMS.analyticsSearchesRead],
  "utm:read": [PERMS.analyticsUtmRead],
  "utm:write": [PERMS.analyticsUtmWrite],
  "videos:read": [PERMS.usersBrowseRead],
  "videos:write": [PERMS.usersModerationWrite],
  "comments:read": [PERMS.usersBrowseRead],
  "comments:write": [PERMS.usersModerationWrite],
  "replies:read": [PERMS.usersBrowseRead],
  "replies:write": [PERMS.usersModerationWrite],
  "followers:read": [PERMS.usersBrowseRead],
  "referrals:read": [PERMS.usersBrowseRead],
  "creators:read": [PERMS.creatorsDashboardRead],
  "creators:write": [PERMS.creatorsModerationWrite],
  "curated:read": [PERMS.curatedPlaylistsRead],
  "curated:write": [PERMS.curatedPlaylistsWrite],
  "inventory_claims:read": [PERMS.inventoryClaimsRead],
  "inventory_claims:write": [PERMS.inventoryClaimsWrite],
  "ranking_anomalies:read": [PERMS.inventoryRankingRead],
  "ranking_anomalies:write": [PERMS.inventoryRankingWrite],
  "flags:read": [PERMS.flagsReviewRead],
  "flags:write": [PERMS.flagsReviewWrite],
  "migration:read": [PERMS.migrationRequestsRead],
  "migration:write": [PERMS.migrationRequestsWrite],
  "feedback:read": [PERMS.feedbackInboxRead],
  "collaboration:read": [PERMS.collaborationInquiriesRead],
  "discovery-source:read": [PERMS.adminsAccountsRead],
  "discovery-source:write": [PERMS.adminsAccountsWrite],
  "youtube_keys:read": [PERMS.youtubeKeysManageRead],
  "youtube_keys:write": [PERMS.youtubeKeysManageWrite],
  "admins:read": [PERMS.adminsAccountsRead],
  "admins:write": [PERMS.adminsAccountsWrite],
  "roles:write": [PERMS.rolesManagementWrite],
}

/** Expand legacy umbrella / granular keys for role editor display. */
export function expandLegacyPermissions(permissions: string[]): Permission[] {
  const set = new Set<string>(permissions)
  for (const p of permissions) {
    const expanded = LEGACY_EXPANSIONS[p]
    if (expanded) {
      for (const perm of expanded) set.add(perm)
    }
  }
  return [...set].filter(isKnownPermission)
}

export function hasPermission(
  permissions: string[] | undefined,
  perm: Permission,
): boolean {
  if (!permissions?.length) return false
  if (permissions.includes(perm)) return true

  const legacy = LEGACY_GRANTS[perm]
  if (legacy?.some((p) => permissions.includes(p))) return true

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
      return [PERMS.curatedPlaylistsRead, PERMS.curatedPlaylistsWrite]
    case "support":
      return [
        PERMS.usersBrowseRead,
        PERMS.creatorsDashboardRead,
        PERMS.feedbackInboxRead,
        PERMS.collaborationInquiriesRead,
        PERMS.flagsReviewRead,
        PERMS.migrationRequestsRead,
      ]
    case "inventory_ops":
      return [...INVENTORY_READ, ...INVENTORY_WRITE]
    case "platform_ops":
      return [
        ...ANALYTICS_READ,
        ...ANALYTICS_WRITE,
        PERMS.usersBrowseRead,
        PERMS.usersModerationWrite,
        PERMS.creatorsDashboardRead,
        PERMS.creatorsModerationWrite,
        PERMS.flagsReviewRead,
        PERMS.flagsReviewWrite,
        PERMS.migrationRequestsRead,
        PERMS.migrationRequestsWrite,
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
  overview: PERMS.analyticsCountersRead,
  users: PERMS.usersBrowseRead,
  videos: PERMS.usersBrowseRead,
  comments: PERMS.usersBrowseRead,
  replies: PERMS.usersBrowseRead,
  flags: PERMS.flagsReviewRead,
  feedback: PERMS.feedbackInboxRead,
  activity: PERMS.analyticsJourneysRead,
  journeys: PERMS.analyticsJourneysRead,
  referrals: PERMS.usersBrowseRead,
  followers: PERMS.usersBrowseRead,
  searches: PERMS.analyticsSearchesRead,
  utm_polls: PERMS.analyticsUtmRead,
  collaboration: PERMS.collaborationInquiriesRead,
  discovery_source: PERMS.adminsAccountsRead,
  migrations: PERMS.migrationRequestsRead,
  curated_playlists: PERMS.curatedPlaylistsRead,
  admins: PERMS.adminsAccountsRead,
  admin_roles: PERMS.rolesManagementRead,
  artist_inventory: PERMS.inventoryArtistsRead,
  ranking_anomalies: PERMS.inventoryRankingRead,
  creators: PERMS.creatorsDashboardRead,
  tools: PERMS.youtubeKeysManageRead,
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
