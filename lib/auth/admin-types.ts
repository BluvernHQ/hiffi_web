export interface AdminSession {
  admin_id: string
  username: string
  email: string
  /** Display label only — do not use for access control. */
  role: string
  /** Resolved at login; use for nav and action gating. */
  permissions?: string[]
}

export function isValidAdminSession(value: unknown): value is AdminSession {
  if (!value || typeof value !== "object") return false
  const v = value as Record<string, unknown>
  const hasCoreFields =
    typeof v.admin_id === "string" &&
    typeof v.username === "string" &&
    typeof v.email === "string" &&
    typeof v.role === "string"
  if (!hasCoreFields) return false
  // permissions[] required for v2; absent sessions fall back to role-derived permissions
  if (v.permissions !== undefined && !Array.isArray(v.permissions)) return false
  return true
}

import { getDefaultSectionForAdmin } from "./admin-permissions"

export function getDefaultAdminSection(admin: AdminSession): string {
  return getDefaultSectionForAdmin(admin)
}
