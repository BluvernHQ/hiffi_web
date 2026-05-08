import type { ApiClientContext } from "./context"

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

export async function verifyOtp(
  ctx: ApiClientContext,
  data: { id: string; otp: string },
): Promise<{
  success: boolean
  data?: {
    expires_in: number
    id: number
    token: string
    uid: string
    user: { name: string; uid: string; username: string }
  }
  error?: string
}> {
  const response = await ctx.request<{
    success: boolean
    data?: {
      expires_in: number
      id: number
      token: string
      uid: string
      user: { name: string; uid: string; username: string }
    }
    error?: string
  }>(
    "/auth/verify",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    false,
  )

  if (response.success && response.data?.token) {
    ctx.setAuthToken(response.data.token)
  }

  return response
}

