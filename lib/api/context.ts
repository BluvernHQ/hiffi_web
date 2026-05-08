import type { ApiError } from "@/lib/api-client"

export type ApiClientContext = {
  request<T>(endpoint: string, options?: RequestInit, requiresAuth?: boolean): Promise<T>
  proxyRequest<T>(pathname: string, searchParams?: URLSearchParams): Promise<T>
  getAuthToken(): string | null
  setAuthToken(token: string): void
  clearAuthToken(): void
  setCredentials(username: string, password: string): void
  clearCredentials(): void
}

export function asApiError(error: unknown): Partial<ApiError> | null {
  return (error as Partial<ApiError>) ?? null
}

