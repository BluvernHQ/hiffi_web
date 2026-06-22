import type { AdminApiClientContext } from "./context"
import type { AdminRole, AdminSession } from "@/lib/auth/admin-types"
import { unwrapSuccessData } from "./envelope"

export type AdminRow = AdminSession & {
  disabled?: boolean
  created_at?: string
}

export async function adminInviteAdmin(
  ctx: AdminApiClientContext,
  body: {
    username: string
    email: string
    password: string
    role: AdminRole
  },
): Promise<{ success: boolean; data?: { id: string } }> {
  return ctx.request(
    "/admin/admins/invite",
    {
      method: "POST",
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
