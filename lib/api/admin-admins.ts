import type { AdminApiClientContext } from "./context"
import type { AdminSession } from "@/lib/auth/admin-types"
import { unwrapSuccessData } from "./envelope"

export type AdminRow = AdminSession & {
  disabled?: boolean
  created_at?: string
}

export type AdminInviteResponse = {
  success: boolean
  data?: {
    admin_id?: string
    username?: string
    email?: string
    role?: string
    admin?: AdminSession
    message?: string
  }
}

export async function adminInviteAdmin(
  ctx: AdminApiClientContext,
  body: {
    username: string
    email: string
    password: string
    role: string
  },
): Promise<AdminInviteResponse> {
  return ctx.request(
    "/admin/admins/invite",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    true,
  )
}

export async function adminUpdateAdmin(
  ctx: AdminApiClientContext,
  adminId: string,
  body: {
    role?: string
    disabled?: boolean
    password?: string
  },
): Promise<{ success: boolean }> {
  return ctx.request(
    `/admin/admins/${encodeURIComponent(adminId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
    true,
  )
}

export async function adminListAdmins(
  ctx: AdminApiClientContext,
  params: { limit?: number; offset?: number } = {},
): Promise<{ admins: AdminRow[]; count: number; limit: number; offset: number }> {
  const sp = new URLSearchParams()
  if (params.limit != null) sp.set("limit", String(params.limit))
  if (params.offset != null) sp.set("offset", String(params.offset))
  const endpoint = `/admin/admins${sp.toString() ? `?${sp.toString()}` : ""}`
  const raw = await ctx.request<unknown>(endpoint, { method: "GET" }, true)
  const data = unwrapSuccessData<{
    admins?: AdminRow[]
    count?: number
    limit?: number
    offset?: number
  }>(raw)
  return {
    admins: data.admins ?? [],
    count: Number(data.count ?? 0),
    limit: Number(data.limit ?? params.limit ?? 20),
    offset: Number(data.offset ?? params.offset ?? 0),
  }
}
