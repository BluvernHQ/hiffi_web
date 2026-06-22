import type { AdminApiClientContext } from "./context"
import type { AdminSession } from "@/lib/auth/admin-types"
import { assertSuccess } from "./envelope"

export type AdminLoginResponse = {
  success: boolean
  data: {
    token: string
    expires_in: number
    admin: AdminSession
  }
}

export async function adminLogin(
  ctx: AdminApiClientContext,
  data: { username: string; password: string },
): Promise<AdminLoginResponse> {
  const response = await ctx.request<AdminLoginResponse>(
    "/admin/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ username: data.username, password: data.password }),
    },
    false,
  )
  if (response.success && response.data?.token) {
    ctx.setAuthToken(response.data.token)
    ctx.setAdminData(response.data.admin)
  }
  return response
}

export async function adminVerifyInvite(
  ctx: AdminApiClientContext,
  data: { id: string; otp: string },
): Promise<AdminLoginResponse> {
  const response = await ctx.request<AdminLoginResponse>(
    "/admin/auth/verify-invite",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    false,
  )
  if (response.success && response.data?.token) {
    ctx.setAuthToken(response.data.token)
    ctx.setAdminData(response.data.admin)
  }
  return response
}

export async function adminRequestPasswordReset(
  ctx: AdminApiClientContext,
  email: string,
): Promise<{ success: boolean; data?: { id: string } }> {
  return ctx.request(
    "/admin/auth/reset-password/request",
    {
      method: "POST",
      body: JSON.stringify({ email }),
    },
    false,
  )
}

export async function adminVerifyPasswordReset(
  ctx: AdminApiClientContext,
  data: { id: string; otp: string; new_password: string },
): Promise<{ success: boolean }> {
  return ctx.request(
    "/admin/auth/reset-password/verify",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    false,
  )
}

export function parseAdminLoginData(raw: unknown): AdminLoginResponse["data"] | null {
  try {
    return assertSuccess<AdminLoginResponse["data"]>(raw)
  } catch {
    return null
  }
}
