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
      canUsersWrite: hasPermission(permissions, PERMS.usersWrite),
      canCreatorsWrite: hasPermission(permissions, PERMS.creatorsWrite),
      canCuratedWrite: hasPermission(permissions, PERMS.curatedWrite),
      canInventoryWrite: hasPermission(permissions, PERMS.inventoryWrite),
      canFlagsWrite: hasPermission(permissions, PERMS.flagsWrite),
      canMigrationWrite: hasPermission(permissions, PERMS.migrationWrite),
      canAnalyticsWrite: hasPermission(permissions, PERMS.analyticsWrite),
      canYoutubeKeysWrite: hasPermission(permissions, PERMS.youtubeKeysWrite),
      canAdminsWrite: hasPermission(permissions, PERMS.adminsWrite),
      canRolesWrite: hasPermission(permissions, PERMS.rolesWrite),
    }
  }, [admin])
}

export { PERMS, type Permission }
