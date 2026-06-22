"use client"

import { useMemo } from "react"
import { useAdminAuth } from "@/lib/admin-auth-context"
import {
  adminCan,
  adminCanWrite,
  adminCanCurate,
  isCuratorOnlyAdmin,
  type AdminPermission,
} from "@/lib/auth/admin-permissions"
import type { AdminRole } from "@/lib/auth/admin-types"

export function useAdminPermissions() {
  const { admin } = useAdminAuth()

  return useMemo(
    () => ({
      admin,
      role: admin?.role as AdminRole | undefined,
      isSuperAdmin: admin?.role === "super_admin",
      isCurator: admin?.role === "curator",
      isReadOnly: admin?.role === "read_only",
      isCuratorOnly: isCuratorOnlyAdmin(admin),
      can: (permission: AdminPermission) => adminCan(admin, permission),
      canWrite: adminCanWrite(admin),
      canCurate: adminCanCurate(admin),
    }),
    [admin],
  )
}
