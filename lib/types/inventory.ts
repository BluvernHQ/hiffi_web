export interface ApiSuccess<T> {
  success: true
  data: T
}

export interface ApiError {
  success: false
  error: string
}

export const INVENTORY_SOCIAL_PLATFORMS = [
  { key: "instagram", label: "Instagram", shortLabel: "IG" },
  { key: "youtube", label: "YouTube", shortLabel: "YT" },
  { key: "tiktok", label: "TikTok", shortLabel: "TT" },
  { key: "facebook", label: "Facebook", shortLabel: "FB" },
] as const

export type InventorySocialPlatform = (typeof INVENTORY_SOCIAL_PLATFORMS)[number]["key"]

export type InventorySocialLinks = {
  instagram?: string
  youtube?: string
  tiktok?: string
  facebook?: string
  [key: string]: string | undefined
}

export type PublicInventoryClaimStatus = "unclaimed" | "pending" | "claimed"

export type InventorySort = "verified_first" | "featured" | "name"

export interface PublicInventoryProfile {
  username: string
  artist_name: string
  bio?: string | null
  other_socials?: InventorySocialLinks | null
  location?: string | null
  genre?: string | null
  banner_image?: string | null
  claim_status: PublicInventoryClaimStatus
  created_at?: string
  updated_at?: string
}

export interface InventoryProfileListResponse {
  items: PublicInventoryProfile[]
  limit: number
  offset: number
  count: number
  total: number
  has_more: boolean
  search?: string
  username?: string
  location?: string
  genre?: string
  claim_status?: PublicInventoryClaimStatus
  sort?: InventorySort
}

export type DiscoverySource =
  | "google_search"
  | "email"
  | "instagram"
  | "chatgpt"
  | "other";

export const DISCOVERY_SOURCE_OPTIONS: {
  value: DiscoverySource
  label: string
}[] = [
  { value: "google_search", label: "Search (Google)" },
  { value: "email", label: "Email" },
  { value: "instagram", label: "Instagram" },
  { value: "chatgpt", label: "ChatGPT" },
  { value: "other", label: "Other" },
]

export interface InventoryClaimSubmit {
  username: string
  name: string
  email: string
  discovery_source: DiscoverySource
  discovery_source_other?: string
  turnstile_token?: string
}

export interface InventoryClaimSubmitResponse {
  id: string
  username: string
  status: "pending"
  message: string
  discovery_source: DiscoverySource
  discovery_source_label?: string
  discovery_source_other?: string
}

export type InventoryClaimStatus = "pending" | "approved" | "rejected"

export type OnboardingStatus =
  | "awaiting_email"
  | "email_sent"
  | "link_opened"
  | "activated"

export interface InventoryClaim {
  id: string
  username: string
  artist_name?: string
  name: string
  email: string
  status: InventoryClaimStatus
  discovery_source?: DiscoverySource
  discovery_source_other?: string
  discovery_source_label?: string
  client_ip?: string
  /** Approved claims only (derived). */
  onboarding_status?: OnboardingStatus
  welcome_email_sent_at?: string
  onboard_verified_at?: string
  password_set_at?: string
  last_login_at?: string
  created_at: string
  updated_at: string
}

export interface InventoryClaimApproveResponse {
  claim: InventoryClaim
  rejected_count: number
  user_updated: boolean
  user_uid?: string
  email_sent: boolean
}

export interface InventoryClaimDeleteResponse {
  deleted: true
  id: string
  claim: InventoryClaim
}

export interface ClaimOnboardVerifyResponse {
  valid: true
  username: string
  name: string
  email: string
}

export interface ClaimOnboardCompleteResponse {
  token: string
  expires_in: number
  user: {
    uid: string
    username: string
    name: string
  }
}

export interface InventoryEntry {
  id: number
  username: string
  artist_key?: string
  artist_name: string
  bio?: string | null
  email?: string | null
  other_socials?: InventorySocialLinks | null
  location?: string | null
  user_uid?: string | null
  /** Present when backend includes it on admin list (public inventory always has this). */
  claim_status?: PublicInventoryClaimStatus
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

function normalizePublicClaimStatus(value: unknown): PublicInventoryClaimStatus {
  const status = String(value ?? "").trim().toLowerCase()
  if (status === "pending" || status === "claimed") return status
  return "unclaimed"
}

function normalizeClaimReviewStatus(value: unknown): InventoryClaimStatus {
  const status = String(value ?? "").trim().toLowerCase()
  if (status === "approved" || status === "rejected") return status
  return "pending"
}

function normalizeOnboardingStatus(value: unknown): OnboardingStatus | undefined {
  const status = String(value ?? "").trim().toLowerCase()
  if (
    status === "awaiting_email" ||
    status === "email_sent" ||
    status === "link_opened" ||
    status === "activated"
  ) {
    return status
  }
  return undefined
}

function optionalTimestamp(value: unknown): string | undefined {
  const raw = value != null ? String(value).trim() : ""
  return raw || undefined
}

export function normalizeInventoryClaim(raw: Record<string, unknown>): InventoryClaim {
  const artistName =
    raw.artist_name != null && String(raw.artist_name).trim()
      ? String(raw.artist_name).trim()
      : undefined
  const clientIp =
    raw.client_ip != null && String(raw.client_ip).trim()
      ? String(raw.client_ip).trim()
      : undefined

  const discoverySource =
    raw.discovery_source != null && String(raw.discovery_source).trim()
      ? (String(raw.discovery_source).trim() as DiscoverySource)
      : undefined

  const discoverySourceOther =
    raw.discovery_source_other != null && String(raw.discovery_source_other).trim()
      ? String(raw.discovery_source_other).trim()
      : undefined

  const discoverySourceLabel =
    raw.discovery_source_label != null && String(raw.discovery_source_label).trim()
      ? String(raw.discovery_source_label).trim()
      : undefined

  const onboardingStatus = normalizeOnboardingStatus(raw.onboarding_status)

  return {
    id: String(raw.id ?? "").trim(),
    username: String(raw.username ?? "").trim().toLowerCase(),
    artist_name: artistName,
    name: String(raw.name ?? "").trim(),
    email: String(raw.email ?? "").trim(),
    status: normalizeClaimReviewStatus(raw.status),
    client_ip: clientIp,
    created_at: String(raw.created_at ?? ""),
    updated_at: String(raw.updated_at ?? ""),
    discovery_source: discoverySource,
    discovery_source_other: discoverySourceOther,
    discovery_source_label: discoverySourceLabel,
    ...(onboardingStatus ? { onboarding_status: onboardingStatus } : {}),
    ...(optionalTimestamp(raw.welcome_email_sent_at)
      ? { welcome_email_sent_at: optionalTimestamp(raw.welcome_email_sent_at) }
      : {}),
    ...(optionalTimestamp(raw.onboard_verified_at)
      ? { onboard_verified_at: optionalTimestamp(raw.onboard_verified_at) }
      : {}),
    ...(optionalTimestamp(raw.password_set_at)
      ? { password_set_at: optionalTimestamp(raw.password_set_at) }
      : {}),
    ...(optionalTimestamp(raw.last_login_at)
      ? { last_login_at: optionalTimestamp(raw.last_login_at) }
      : {}),
  }
}

export function normalizeInventoryClaimApproveResponse(
  raw: Record<string, unknown>,
): InventoryClaimApproveResponse {
  const claimRaw =
    raw.claim && typeof raw.claim === "object" && !Array.isArray(raw.claim)
      ? (raw.claim as Record<string, unknown>)
      : {}
  const userUid =
    raw.user_uid != null && String(raw.user_uid).trim()
      ? String(raw.user_uid).trim()
      : undefined

  return {
    claim: normalizeInventoryClaim(claimRaw),
    rejected_count: Number(raw.rejected_count ?? 0),
    user_updated: Boolean(raw.user_updated),
    ...(userUid ? { user_uid: userUid } : {}),
    email_sent: Boolean(raw.email_sent),
  }
}

export function normalizeInventoryClaimDeleteResponse(
  raw: Record<string, unknown>,
): InventoryClaimDeleteResponse {
  const claimRaw =
    raw.claim && typeof raw.claim === "object" && !Array.isArray(raw.claim)
      ? (raw.claim as Record<string, unknown>)
      : {}
  const id = String(raw.id ?? claimRaw.id ?? "").trim()

  return {
    deleted: true,
    id,
    claim: normalizeInventoryClaim(claimRaw),
  }
}

export function normalizeInventoryEntry(raw: Record<string, unknown>): InventoryEntry {
  const artistKey =
    raw.artist_key != null && String(raw.artist_key).trim()
      ? String(raw.artist_key).trim()
      : undefined
  const hasClaimStatus = raw.claim_status != null && String(raw.claim_status).trim() !== ""
  return {
    id: Number(raw.id ?? 0),
    username: String(raw.username ?? "").trim(),
    artist_key: artistKey,
    artist_name: String(raw.artist_name ?? "").trim(),
    bio: raw.bio != null && String(raw.bio).trim() ? String(raw.bio).trim() : undefined,
    email: raw.email != null && String(raw.email).trim() ? String(raw.email).trim() : undefined,
    other_socials: normalizeInventorySocials(raw),
    location: raw.location != null && String(raw.location).trim() ? String(raw.location).trim() : undefined,
    user_uid: raw.user_uid != null && String(raw.user_uid).trim() ? String(raw.user_uid).trim() : undefined,
    claim_status: hasClaimStatus ? normalizePublicClaimStatus(raw.claim_status) : undefined,
    created_at: String(raw.created_at ?? ""),
    updated_at: String(raw.updated_at ?? ""),
  }
}

export function normalizePublicInventoryProfile(raw: Record<string, unknown>): PublicInventoryProfile {
  const genre =
    raw.genre != null && String(raw.genre).trim() ? String(raw.genre).trim().toLowerCase() : undefined
  const bannerImage =
    raw.banner_image != null && String(raw.banner_image).trim()
      ? String(raw.banner_image).trim()
      : undefined
  const createdAt = raw.created_at != null && String(raw.created_at).trim() ? String(raw.created_at) : undefined
  const updatedAt = raw.updated_at != null && String(raw.updated_at).trim() ? String(raw.updated_at) : undefined

  return {
    username: String(raw.username ?? "").trim().toLowerCase(),
    artist_name: String(raw.artist_name ?? "").trim(),
    bio: raw.bio != null && String(raw.bio).trim() ? String(raw.bio).trim() : undefined,
    other_socials: normalizeInventorySocials(raw),
    location: raw.location != null && String(raw.location).trim() ? String(raw.location).trim() : undefined,
    genre,
    banner_image: bannerImage,
    claim_status: normalizePublicClaimStatus(raw.claim_status),
    ...(createdAt ? { created_at: createdAt } : {}),
    ...(updatedAt ? { updated_at: updatedAt } : {}),
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
  platform: InventorySocialPlatform,
): string | undefined {
  const fromOther = entry.other_socials?.[platform]
  if (typeof fromOther === "string" && fromOther.trim()) return fromOther.trim()
  const legacy = entry[platform]
  if (typeof legacy === "string" && legacy.trim()) return legacy.trim()
  return undefined
}
