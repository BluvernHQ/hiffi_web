import type { AdminApiClientContext } from "./context"
import { unwrapSuccessData } from "./envelope"

export type AdminRoleRow = {
  role_key: string
  display_name: string
  is_system: boolean
  permissions: string[]
}

export async function adminListRoles(
  ctx: AdminApiClientContext,
): Promise<{ roles: AdminRoleRow[]; count: number }> {
  const raw = await ctx.request<unknown>("/admin/roles", { method: "GET" }, true)
  const data = unwrapSuccessData<{ roles?: AdminRoleRow[]; count?: number }>(raw)
  return {
    roles: data.roles ?? [],
    count: Number(data.count ?? data.roles?.length ?? 0),
  }
}

export async function adminCreateRole(
  ctx: AdminApiClientContext,
  body: {
    role_key: string
    display_name: string
    permissions: string[]
  },
): Promise<{ success: boolean }> {
  return ctx.request(
    "/admin/roles",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    true,
  )
}

export async function adminUpdateRole(
  ctx: AdminApiClientContext,
  roleKey: string,
  body: {
    display_name?: string
    permissions?: string[]
  },
): Promise<{ success: boolean }> {
  return ctx.request(
    `/admin/roles/${encodeURIComponent(roleKey)}`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
    true,
  )
}

export async function adminDeleteRole(
  ctx: AdminApiClientContext,
  roleKey: string,
): Promise<{ success: boolean }> {
  return ctx.request(
    `/admin/roles/${encodeURIComponent(roleKey)}`,
    { method: "DELETE" },
    true,
  )
}
