import type { ApiClientContext } from "./context"

export type RegisterResponseData = {
  id?: number
  uid?: string
  token: string
  expires_in?: number
  user: { name: string; uid: string; username: string }
}

export async function login(
  ctx: ApiClientContext,
  data: { username?: string; email?: string; password: string },
): Promise<{
  success: boolean
  data: { token: string; user: { name: string; uid: string; username: string } }
}> {
  const response = await ctx.request<{
    success: boolean
    data: { token: string; user: { name: string; uid: string; username: string } }
  }>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    false,
  )

  if (response.success && response.data.token) {
    ctx.setAuthToken(response.data.token)
    ctx.setCredentials(response.data.user.username, data.password)
  }

  return response
}

export async function register(
  ctx: ApiClientContext,
  data: {
    username: string
    name: string
    password: string
    email: string
    referral_code?: string
  },
): Promise<{
  success: boolean
  data?: RegisterResponseData
  error?: string
}> {
  const response = await ctx.request<{
    success: boolean
    data?: RegisterResponseData
    error?: string
  }>(
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify({
        ...data,
        signup_flow: "instant",
      }),
    },
    false,
  )

  if (response.success && response.data?.token) {
    ctx.setAuthToken(response.data.token)
  }

  return response
}
