import type { ApiError, ApiSuccess } from "@/lib/types/inventory"

export type { ApiError, ApiSuccess }

export interface DiscoverySourceFormSubmit {
  name: string
  email: string
  how_find_us: string
  turnstile_token?: string
}

export interface DiscoverySourceSubmitResponse {
  id: string
}

export interface DiscoverySourceSubmission {
  id: string
  name: string
  email: string
  how_find_us: string
  client_ip?: string
  created_at: string
}

export interface DiscoverySourceListResponse {
  submissions: DiscoverySourceSubmission[]
  limit: number
  offset: number
  count: number
}
