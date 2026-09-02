import {
  expandLegacyPermissions,
  INVENTORY_READ_MODULES,
  INVENTORY_WRITE_MODULES,
  INSIGHTS_READ_MODULES,
  INSIGHTS_WRITE_MODULES,
  PERMS,
  USERS_CONTENT_READ_MODULES,
  USERS_CONTENT_WRITE_MODULES,
  type Permission,
} from "@/lib/auth/admin-permissions"

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

function optionsFor(
  modules: Permission[],
  labels: Partial<Record<Permission, { label: string; description?: string }>>,
): PermissionOption[] {
  return modules.map((value) => ({
    value,
    label: labels[value]?.label ?? value,
    description: labels[value]?.description,
  }))
}

/** Module-level permissions for the role editor — one checkbox per dashboard area. */
export const ADMIN_PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: "insights",
    label: "Insights & analytics",
    permissions: optionsFor(
      [...INSIGHTS_READ_MODULES, ...INSIGHTS_WRITE_MODULES],
      {
        [PERMS.dashboardRead]: {
          label: "Dashboard",
          description: "Platform counters and overview metrics",
        },
        [PERMS.dashboardWrite]: {
          label: "Dashboard — manage",
          description: "Resync platform counters",
        },
        [PERMS.journeysRead]: {
          label: "Journeys",
          description: "Funnels and session timelines",
        },
        [PERMS.journeysWrite]: {
          label: "Journeys — manage",
          description: "Run funnel detection and journey tools",
        },
        [PERMS.searchesRead]: {
          label: "Searches",
          description: "Search query logs",
        },
        [PERMS.utmRead]: {
          label: "UTM campaigns",
          description: "UTM polls and campaign URLs",
        },
        [PERMS.utmWrite]: {
          label: "UTM campaigns — manage",
          description: "Create UTM URLs and campaign actions",
        },
      },
    ),
  },
  {
    id: "community",
    label: "Community",
    permissions: optionsFor(
      [
        PERMS.usersRead,
        PERMS.usersWrite,
        PERMS.videosRead,
        PERMS.videosWrite,
        PERMS.commentsRead,
        PERMS.commentsWrite,
        PERMS.repliesRead,
        PERMS.repliesWrite,
        PERMS.followersRead,
        PERMS.referralsRead,
      ],
      {
        [PERMS.usersRead]: { label: "Users", description: "User accounts list" },
        [PERMS.usersWrite]: { label: "Users — manage", description: "Disable / enable users" },
        [PERMS.videosRead]: { label: "Videos", description: "Video moderation list" },
        [PERMS.videosWrite]: { label: "Videos — manage", description: "Delete videos" },
        [PERMS.commentsRead]: { label: "Comments", description: "Comment moderation" },
        [PERMS.commentsWrite]: { label: "Comments — manage", description: "Delete comments" },
        [PERMS.repliesRead]: { label: "Replies", description: "Reply moderation" },
        [PERMS.repliesWrite]: { label: "Replies — manage", description: "Delete replies" },
        [PERMS.followersRead]: { label: "Followers", description: "Follow relationships" },
        [PERMS.referralsRead]: { label: "Referrals", description: "Referral activity" },
      },
    ),
  },
  {
    id: "creators",
    label: "Creators",
    permissions: [
      { value: PERMS.creatorsRead, label: "Creators", description: "Creator directory and detail" },
      {
        value: PERMS.creatorsWrite,
        label: "Creators — manage",
        description: "Suspend / unsuspend creators",
      },
    ],
  },
  {
    id: "editorial",
    label: "Editorial",
    permissions: [
      { value: PERMS.curatedRead, label: "Curated playlists" },
      { value: PERMS.curatedWrite, label: "Curated playlists — manage" },
    ],
  },
  {
    id: "inventory",
    label: "Artist index & Hiffi 500",
    permissions: optionsFor(
      [...INVENTORY_READ_MODULES, ...INVENTORY_WRITE_MODULES],
      {
        [PERMS.inventoryRead]: {
          label: "Artist inventory",
          description: "Browse and export artist profiles",
        },
        [PERMS.inventoryWrite]: {
          label: "Artist inventory — manage",
          description: "Upload and edit inventory",
        },
        [PERMS.inventoryClaimsRead]: {
          label: "Inventory claims",
          description: "Artist claim requests",
        },
        [PERMS.inventoryClaimsWrite]: {
          label: "Inventory claims — manage",
          description: "Approve or reject claims",
        },
        [PERMS.rankingAnomaliesRead]: {
          label: "Score anomalies",
          description: "Hiffi 500 ranking anomalies",
        },
        [PERMS.rankingAnomaliesWrite]: {
          label: "Score anomalies — manage",
          description: "Scan and close anomalies",
        },
      },
    ),
  },
  {
    id: "moderation",
    label: "Reports & operations",
    permissions: [
      { value: PERMS.flagsRead, label: "Content reports" },
      { value: PERMS.flagsWrite, label: "Content reports — manage" },
      { value: PERMS.migrationRead, label: "Migration requests" },
      { value: PERMS.migrationWrite, label: "Migration requests — manage" },
    ],
  },
  {
    id: "inbox",
    label: "Inbox",
    permissions: [
      { value: PERMS.feedbackRead, label: "Feedback" },
      { value: PERMS.collaborationRead, label: "Collaboration inquiries" },
      { value: PERMS.discoverySourceRead, label: "Discovery survey" },
      {
        value: PERMS.discoverySourceWrite,
        label: "Discovery survey — manage",
        description: "Delete survey responses",
      },
    ],
  },
  {
    id: "access",
    label: "Access & tools",
    permissions: [
      { value: PERMS.adminsRead, label: "Team & roles list" },
      { value: PERMS.adminsWrite, label: "Team — manage", description: "Invite and edit team members" },
      { value: PERMS.rolesWrite, label: "Roles — manage", description: "Create and edit custom roles" },
      { value: PERMS.youtubeKeysRead, label: "YouTube API keys" },
      { value: PERMS.youtubeKeysWrite, label: "YouTube API keys — manage" },
    ],
  },
]

/** Permissions shown in the role editor (module-level only). */
export const ALL_ASSIGNABLE_PERMISSIONS: Permission[] = ADMIN_PERMISSION_GROUPS.flatMap((g) =>
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

export function permissionsForGroup(groupId: string): Permission[] {
  const group = ADMIN_PERMISSION_GROUPS.find((g) => g.id === groupId)
  return group?.permissions.map((p) => p.value) ?? []
}
