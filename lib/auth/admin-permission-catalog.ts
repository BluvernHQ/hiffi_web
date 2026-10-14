import {
  expandLegacyPermissions,
  isKnownPermission,
  PERMS,
  type Permission,
} from "@/lib/auth/admin-permissions"
import type {
  AdminPermissionsCatalog,
  CatalogModule,
} from "@/lib/api/admin-permissions-catalog"

export type PermissionOption = {
  value: Permission
  label: string
  description?: string
}

export type PermissionGroup = {
  id: string
  label: string
  permissions: PermissionOption[]
}

/** Static fallback when the catalog API is unavailable. Mirrors `GET /admin/permissions/catalog`. */
export const FALLBACK_PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: "admins",
    label: "Admins",
    permissions: [
      { value: PERMS.adminsAccountsRead, label: "View admin accounts" },
      { value: PERMS.adminsAccountsWrite, label: "Create / update admin accounts" },
      { value: PERMS.rolesManagementRead, label: "View roles" },
      { value: PERMS.rolesManagementWrite, label: "Manage roles" },
    ],
  },
  {
    id: "users",
    label: "Users",
    permissions: [
      { value: PERMS.usersBrowseRead, label: "Browse users and content lists" },
      { value: PERMS.usersModerationWrite, label: "Moderate users and content" },
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    permissions: [
      { value: PERMS.analyticsCountersRead, label: "View platform counters" },
      { value: PERMS.analyticsCountersWrite, label: "Resync platform counters" },
      { value: PERMS.analyticsUtmRead, label: "View UTM polls and URLs" },
      { value: PERMS.analyticsUtmWrite, label: "Create UTM URLs" },
      { value: PERMS.analyticsSearchesRead, label: "View search logs" },
    ],
  },
  {
    id: "creators",
    label: "Creators",
    permissions: [
      { value: PERMS.creatorsDashboardRead, label: "View creator metrics" },
      { value: PERMS.creatorsModerationWrite, label: "Suspend / unsuspend creators" },
    ],
  },
  {
    id: "curated",
    label: "Curated",
    permissions: [
      { value: PERMS.curatedPlaylistsRead, label: "View curated playlists" },
      { value: PERMS.curatedPlaylistsWrite, label: "Manage curated playlists" },
    ],
  },
  {
    id: "flags",
    label: "Flags",
    permissions: [
      { value: PERMS.flagsReviewRead, label: "View content reports" },
      { value: PERMS.flagsReviewWrite, label: "Update report status" },
    ],
  },
  {
    id: "migration",
    label: "Migration",
    permissions: [
      { value: PERMS.migrationRequestsRead, label: "View migration requests" },
      { value: PERMS.migrationRequestsWrite, label: "Update migration requests" },
    ],
  },
  {
    id: "collaboration",
    label: "Collaboration",
    permissions: [
      { value: PERMS.collaborationInquiriesRead, label: "View collaboration inquiries" },
    ],
  },
  {
    id: "feedback",
    label: "Feedback",
    permissions: [{ value: PERMS.feedbackInboxRead, label: "View feedback inbox" }],
  },
  {
    id: "inventory",
    label: "Inventory",
    permissions: [
      { value: PERMS.inventoryArtistsRead, label: "View artist inventory" },
      { value: PERMS.inventoryArtistsWrite, label: "Manage artist inventory" },
      { value: PERMS.inventoryClaimsRead, label: "View inventory claims" },
      { value: PERMS.inventoryClaimsWrite, label: "Approve inventory claims" },
      { value: PERMS.inventoryRankingRead, label: "View ranking anomalies" },
      { value: PERMS.inventoryRankingWrite, label: "Scan / close ranking anomalies" },
    ],
  },
  {
    id: "auth",
    label: "Sign-in",
    permissions: [
      { value: PERMS.authProvidersRead, label: "View login providers" },
      { value: PERMS.authProvidersWrite, label: "Manage login providers" },
    ],
  },
  {
    id: "youtube",
    label: "YouTube",
    permissions: [
      { value: PERMS.youtubeKeysManageRead, label: "View YouTube API keys" },
      { value: PERMS.youtubeKeysManageWrite, label: "Manage YouTube API keys" },
    ],
  },
]

export function catalogToPermissionGroups(catalog: AdminPermissionsCatalog): PermissionGroup[] {
  return catalog.modules
    .map((module: CatalogModule) => ({
      id: module.key,
      label: module.label,
      permissions: module.sub_features.flatMap((sub) =>
        sub.permissions
          .filter((p) => isKnownPermission(p.key))
          .map((p) => ({
            value: p.key as Permission,
            label: p.label,
          })),
      ),
    }))
    .filter((group) => group.permissions.length > 0)
}

/** Permissions shown in the role editor. */
export const ALL_ASSIGNABLE_PERMISSIONS: Permission[] = FALLBACK_PERMISSION_GROUPS.flatMap((g) =>
  g.permissions.map((p) => p.value),
)

const ROLE_KEY_RE = /^[a-z][a-z0-9_]{2,29}$/

export function isValidRoleKey(value: string): boolean {
  return ROLE_KEY_RE.test(value.trim())
}

export function formatPermissionList(permissions: string[]): string {
  const expanded = expandLegacyPermissions(permissions)
  const known = new Set(ALL_ASSIGNABLE_PERMISSIONS)
  const sorted = expanded.filter((p) => known.has(p)).sort()
  const extra = expanded.filter((p) => !known.has(p))
  return [...sorted, ...extra].join(", ") || "—"
}

export function rolesAssignableToAdmin<T extends { role_key: string }>(
  roles: T[],
  currentAdmin: { role: string } | null | undefined,
): T[] {
  const canAssignSuperAdmin = currentAdmin?.role === "super_admin"
  if (canAssignSuperAdmin) return roles
  return roles.filter((r) => r.role_key !== "super_admin")
}

export function permissionsForGroup(
  groupId: string,
  groups: PermissionGroup[] = FALLBACK_PERMISSION_GROUPS,
): Permission[] {
  const group = groups.find((g) => g.id === groupId)
  return group?.permissions.map((p) => p.value) ?? []
}
