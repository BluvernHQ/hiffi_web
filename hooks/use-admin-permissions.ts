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
      canDashboardWrite: hasPermission(permissions, PERMS.dashboardWrite),
      canJourneysWrite: hasPermission(permissions, PERMS.journeysWrite),
      canUtmWrite: hasPermission(permissions, PERMS.utmWrite),
      canUsersWrite: hasPermission(permissions, PERMS.usersWrite),
      canVideosWrite: hasPermission(permissions, PERMS.videosWrite),
      canCommentsWrite: hasPermission(permissions, PERMS.commentsWrite),
      canRepliesWrite: hasPermission(permissions, PERMS.repliesWrite),
      canCreatorsWrite: hasPermission(permissions, PERMS.creatorsWrite),
      canCuratedWrite: hasPermission(permissions, PERMS.curatedWrite),
      canInventoryWrite: hasPermission(permissions, PERMS.inventoryWrite),
      canInventoryClaimsWrite: hasPermission(permissions, PERMS.inventoryClaimsWrite),
      canRankingAnomaliesWrite: hasPermission(permissions, PERMS.rankingAnomaliesWrite),
      canFlagsWrite: hasPermission(permissions, PERMS.flagsWrite),
      canMigrationWrite: hasPermission(permissions, PERMS.migrationWrite),
      canYoutubeKeysWrite: hasPermission(permissions, PERMS.youtubeKeysWrite),
      canAdminsWrite: hasPermission(permissions, PERMS.adminsWrite),
      canDiscoverySourceWrite: hasPermission(permissions, PERMS.discoverySourceWrite),
      canRolesWrite: hasPermission(permissions, PERMS.rolesWrite),
      /** Any insights write module (dashboard, journeys, or UTM). */
      canAnalyticsWrite: hasAnyPermission(permissions, [
        PERMS.dashboardWrite,
        PERMS.journeysWrite,
        PERMS.utmWrite,
        PERMS.analyticsWrite,
      ]),
    }
  }, [admin])
}

export { PERMS, type Permission }
