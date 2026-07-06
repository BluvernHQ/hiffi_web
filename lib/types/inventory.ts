export interface ApiSuccess<T> {
  success: true
  data: T
}

export interface ApiError {
  success: false
  error: string
}

export type InventorySocialLinks = {
  instagram?: string
  youtube?: string
  tiktok?: string
  facebook?: string
  [key: string]: string | undefined
}

export interface PublicInventoryProfile {
  username: string
  artist_name: string
  other_socials?: InventorySocialLinks | null
  location?: string | null
}

export interface InventoryProfileListResponse {
  items: PublicInventoryProfile[]
  limit: number
  offset: number
  count: number
  has_more: boolean
  search?: string
  username?: string
}

export interface InventoryClaimSubmit {
  username: string
  name: string
  email: string
}

export interface InventoryClaimSubmitResponse {
  id: string
  username: string
  status: "pending"
  message: string
}

export type InventoryClaimStatus = "pending" | "approved" | "rejected"

export interface InventoryClaim {
  id: string
  username: string
  artist_name?: string
  name: string
  email: string
  status: InventoryClaimStatus
  client_ip?: string
  created_at: string
  updated_at: string
}

export interface InventoryEntry {
  id: number
  username: string
  artist_name: string
  email?: string | null
  other_socials?: InventorySocialLinks | null
  location?: string | null
  user_uid?: string | null
  created_at: string
  updated_at: string
}

export interface InventoryListResponse {
  items: InventoryEntry[]
  limit: number
  offset: number
  count: number
  has_more: boolean
}

export type InventoryCommand = "CREATE" | "EDIT" | "DELETE"

export interface InventoryUploadResult {
  total_rows: number
  created: number
  updated: number
  deleted: number
  unchanged: number
  users_created: number
  users_updated: number
  users_deleted: number
  skipped: number
  errors?: string[]
}

export interface InventoryClaimListResponse {
  items: InventoryClaim[]
  limit: number
  offset: number
  count: number
  has_more: boolean
  filters: Record<string, string>
}

export const INVENTORY_UPLOAD_MAX_BYTES = 20 * 1024 * 1024

function legacyFlatToSocials(raw: Record<string, unknown>): InventorySocialLinks | undefined {
  const socials: InventorySocialLinks = {}
  for (const key of ["instagram", "youtube", "tiktok", "facebook"] as const) {
    const value = raw[key]
    if (typeof value === "string" && value.trim()) {
      socials[key] = value.trim()
    }
  }
  return Object.keys(socials).length > 0 ? socials : undefined
}

export function normalizeInventorySocials(
  raw: Record<string, unknown>,
): InventorySocialLinks | null | undefined {
  if (raw.other_socials && typeof raw.other_socials === "object" && !Array.isArray(raw.other_socials)) {
    return raw.other_socials as InventorySocialLinks
  }
  return legacyFlatToSocials(raw)
}

export function normalizeInventoryEntry(raw: Record<string, unknown>): InventoryEntry {
  return {
    id: Number(raw.id ?? 0),
    username: String(raw.username ?? "").trim(),
    artist_name: String(raw.artist_name ?? "").trim(),
    email: raw.email != null && String(raw.email).trim() ? String(raw.email).trim() : undefined,
    other_socials: normalizeInventorySocials(raw),
    location: raw.location != null && String(raw.location).trim() ? String(raw.location).trim() : undefined,
    user_uid: raw.user_uid != null && String(raw.user_uid).trim() ? String(raw.user_uid).trim() : undefined,
    created_at: String(raw.created_at ?? ""),
    updated_at: String(raw.updated_at ?? ""),
  }
}

export function normalizePublicInventoryProfile(raw: Record<string, unknown>): PublicInventoryProfile {
  return {
    username: String(raw.username ?? "").trim().toLowerCase(),
    artist_name: String(raw.artist_name ?? "").trim(),
    other_socials: normalizeInventorySocials(raw),
    location: raw.location != null && String(raw.location).trim() ? String(raw.location).trim() : undefined,
  }
}

export function getInventorySocialUrl(
  entry: {
    other_socials?: InventorySocialLinks | null
    instagram?: string
    youtube?: string
    tiktok?: string
    facebook?: string
  },
  platform: "instagram" | "youtube" | "tiktok" | "facebook",
): string | undefined {
  const fromOther = entry.other_socials?.[platform]
  if (typeof fromOther === "string" && fromOther.trim()) return fromOther.trim()
  const legacy = entry[platform]
  if (typeof legacy === "string" && legacy.trim()) return legacy.trim()
  return undefined
}
