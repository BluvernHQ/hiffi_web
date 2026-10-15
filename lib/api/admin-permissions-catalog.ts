import type { AdminApiClientContext } from "./context"
import { unwrapSuccessData } from "./envelope"

export type CatalogPermission = {
  key: string
  label: string
  action: "read" | "write"
  endpoints?: string[]
}

export type CatalogSubFeature = {
  key: string
  label: string
  permissions: CatalogPermission[]
}

export type CatalogModule = {
  key: string
  label: string
  sub_features: CatalogSubFeature[]
}

export type AdminPermissionsCatalog = {
  version: number
  permissions: string[]
  modules: CatalogModule[]
}

export async function adminGetPermissionsCatalog(
  ctx: AdminApiClientContext,
): Promise<AdminPermissionsCatalog> {
  const raw = await ctx.request<unknown>("/admin/permissions/catalog", { method: "GET" }, true)
  const data = unwrapSuccessData<Partial<AdminPermissionsCatalog>>(raw)
  return {
    version: Number(data.version ?? 1),
    permissions: data.permissions ?? [],
    modules: data.modules ?? [],
  }
}
