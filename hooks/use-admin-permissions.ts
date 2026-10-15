"use client"

import { useMemo } from "react"
import { useAdminAuth } from "@/lib/admin-auth-context"
import {
  adminCan,
  getEffectivePermissions,
  hasAnyPermission,
  hasPermission,
  PERMS,
  type Permission,
} from "@/lib/auth/admin-permissions"

export function useAdminPermissions() {
  const { admin } = useAdminAuth()

  return useMemo(() => {
    const permissions = getEffectivePermissions(admin)

    return {
      admin,
      role: admin?.role,
      permissions,
      can: (permission: Permission) => adminCan(admin, permission),
      has: (permission: Permission) => hasPermission(permissions, permission),
      hasAny: (perms: Permission[]) => hasAnyPermission(permissions, perms),
      canDashboardWrite: hasPermission(permissions, PERMS.analyticsCountersWrite),
      canJourneysWrite: hasPermission(permissions, PERMS.analyticsJourneysWrite),
      canUtmWrite: hasPermission(permissions, PERMS.analyticsUtmWrite),
      canUsersWrite: hasPermission(permissions, PERMS.usersModerationWrite),
      canVideosWrite: hasPermission(permissions, PERMS.usersModerationWrite),
      canCommentsWrite: hasPermission(permissions, PERMS.usersModerationWrite),
      canRepliesWrite: hasPermission(permissions, PERMS.usersModerationWrite),
      canCreatorsWrite: hasPermission(permissions, PERMS.creatorsModerationWrite),
      canCuratedWrite: hasPermission(permissions, PERMS.curatedPlaylistsWrite),
      canInventoryWrite: hasPermission(permissions, PERMS.inventoryArtistsWrite),
      canInventoryClaimsWrite: hasPermission(permissions, PERMS.inventoryClaimsWrite),
      canRankingAnomaliesWrite: hasPermission(permissions, PERMS.inventoryRankingWrite),
      canFlagsWrite: hasPermission(permissions, PERMS.flagsReviewWrite),
      canMigrationWrite: hasPermission(permissions, PERMS.migrationRequestsWrite),
      canYoutubeKeysWrite: hasPermission(permissions, PERMS.youtubeKeysManageWrite),
      canAdminsWrite: hasPermission(permissions, PERMS.adminsAccountsWrite),
      canDiscoverySourceWrite: hasPermission(permissions, PERMS.adminsAccountsWrite),
      canRolesRead: hasPermission(permissions, PERMS.rolesManagementRead),
      canRolesWrite: hasPermission(permissions, PERMS.rolesManagementWrite),
      canAnalyticsWrite: hasAnyPermission(permissions, [
        PERMS.analyticsCountersWrite,
        PERMS.analyticsJourneysWrite,
        PERMS.analyticsUtmWrite,
      ]),
    }
  }, [admin])
}

export { PERMS, type Permission }
