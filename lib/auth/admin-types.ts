export type AdminRole = "super_admin" | "curator" | "read_only"

export interface AdminSession {
  admin_id: string
  username: string
  email: string
  role: AdminRole
}

const ADMIN_ROLES: AdminRole[] = ["super_admin", "curator", "read_only"]

export function isAdminRole(value: unknown): value is AdminRole {
  return typeof value === "string" && ADMIN_ROLES.includes(value as AdminRole)
}

export function isValidAdminSession(value: unknown): value is AdminSession {
  if (!value || typeof value !== "object") return false
  const v = value as Record<string, unknown>
  return (
    typeof v.admin_id === "string" &&
    typeof v.username === "string" &&
    typeof v.email === "string" &&
    isAdminRole(v.role)
  )
}

export function getDefaultAdminSection(role: AdminRole): string {
  if (role === "curator") return "curated_playlists"
  return "overview"
}
