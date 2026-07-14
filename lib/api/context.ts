import type { ApiError } from "@/lib/api-client"

export type ProxyApiRequestOptions = {
  method?: string
  body?: string
  searchParams?: URLSearchParams
}

import type { AdminSession } from "@/lib/auth/admin-types"

export type ApiClientContext = {
  request<T>(endpoint: string, options?: RequestInit, requiresAuth?: boolean): Promise<T>
  proxyRequest<T>(pathname: string, searchParams?: URLSearchParams): Promise<T>
  proxyApiRequest<T>(pathname: string, options?: ProxyApiRequestOptions): Promise<T>
  getAuthToken(): string | null
  setAuthToken(token: string): void
  clearAuthToken(): void
  setCredentials(username: string, password: string): void
  clearCredentials(): void
}

/** Admin dashboard client — same transport surface; token is admin JWT only. */
export type AdminApiClientContext = ApiClientContext & {
  getAdminData(): AdminSession | null
  setAdminData(admin: AdminSession): void
  clearSession(): void
}

export function asApiError(error: unknown): Partial<ApiError> | null {
  return (error as Partial<ApiError>) ?? null
}

