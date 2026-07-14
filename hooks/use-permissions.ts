"use client"

import { useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import {
  can,
  getEffectiveRole,
  isAdmin,
  isCreator,
  type Permission,
  type UserRole,
} from "@/lib/auth"

export function usePermissions() {
  const { userData } = useAuth()

  return useMemo(
    () => ({
      userData,
      role: getEffectiveRole(userData) as UserRole,
      isAdmin: isAdmin(userData),
      isCreator: isCreator(userData),
      can: (permission: Permission) => can(userData, permission),
    }),
    [userData],
  )
}
