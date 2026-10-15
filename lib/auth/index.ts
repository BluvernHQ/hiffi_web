export {
  type UserRole,
  type UserLike,
  normalizeRole,
  getEffectiveRole,
  isAdmin,
  isCreator,
  hasRole,
} from "./roles"

export {
  PERMISSIONS,
  type Permission,
  can,
  ADMIN_SECTION_PERMISSION,
  canAccessAdminSection,
} from "./permissions"

export {
  type AdminSession,
  isValidAdminSession,
  getDefaultAdminSection,
} from "./admin-types"

export {
  PERMS,
  type Permission as AdminPermission,
  hasPermission,
  hasAnyPermission,
  getEffectivePermissions,
  adminCan,
  ADMIN_SECTION_PERMISSION as ADMIN_DASHBOARD_SECTION_PERMISSION,
  canAccessAdminSection as canAdminAccessSection,
  getDefaultSectionForAdmin,
  getFirstAllowedSection,
} from "./admin-permissions"
