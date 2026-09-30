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

export type InventorySort = "name" | "name_desc" | "verified_first" | "newest" | "oldest"

export type RankBand = "hiffi_500" | "top_5" | "top_10" | "top_25" | "none"

export type Hiffi500Tier = "global_velocity" | "hot_50" | "rising" | "charting"

export interface InventoryCityRef {
  id: string
  label: string
  region?: string
  country: string
}

/** Weekly-snapshot ranking. Exact rank is only public inside the Hiffi 500. */
export interface PublicRanking {
  status: "ranked" | "not_ranked"
  band: RankBand
  global_rank: number | null
  highlight: {
    kind: "city" | "genre"
    label: string
    rank: number
    total: number
  } | null
  movement: {
    spots_30d: number | null
    streak_weeks: number | null
  } | null
  updated_at: string | null
}

export interface OwnerRankGroup {
  id: string
  label: string
  rank: number | null
  total: number
}

/** `GET /inventory/me/ranking` — private dashboard for the claimed owner. */
export interface OwnerRanking {
  username: string
  status: "ranked" | "not_ranked"
  global_rank: number | null
  total_ranked: number
  percentile: number | null
  band: RankBand
  next_band: {
    band: RankBand
    tier?: Hiffi500Tier
    rank_needed: number
    spots_away: number
  } | null
  city: OwnerRankGroup | null
  genre: OwnerRankGroup | null
  change: { d7: number | null; d30: number | null }
  history: { week: string; global_rank: number | null }[]
  drivers: {
    youtube_score: number | null
    instagram_score: number | null
    momentum_30d: number | null
  }
  updated_at: string | null
}

export interface PublicInventoryProfile {
  username: string
  artist_name: string
  bio?: string | null
  other_socials?: InventorySocialLinks | null
  location?: string | null
  city?: InventoryCityRef | null
  genre?: string | null
  banner_image?: string | null
  claim_status: PublicInventoryClaimStatus
  /** Absent when the API predates the rank ladder. */
  ranking?: PublicRanking
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

export type CollabOpenness = "yes" | "maybe" | "no"

export const COLLAB_OPENNESS_OPTIONS: {
  value: CollabOpenness
  label: string
  description: string
}[] = [
  { value: "yes", label: "Yes, actively", description: "Prioritize me for artist collaborations." },
  { value: "maybe", label: "Maybe", description: "Show me selective opportunities." },
  { value: "no", label: "Not right now", description: "I'm focused on my own releases." },
]

export const PRIMARY_SOUND_OPTIONS: { value: string; label: string }[] = [
  { value: "hip-hop", label: "Hip-Hop" },
  { value: "rap", label: "Rap" },
  { value: "trap", label: "Trap" },
  { value: "drill", label: "Drill" },
  { value: "melodic rap", label: "Melodic Rap" },
  { value: "alternative hip-hop", label: "Alternative Hip-Hop" },
  { value: "boom bap", label: "Boom Bap" },
  { value: "r&b", label: "R&B" },
  { value: "other", label: "Other" },
]

export interface InventoryClaimSubmit {
  username: string
  name: string
  email: string
  discovery_source: DiscoverySource
  discovery_source_other?: string
  turnstile_token?: string
  /** Account setup fields — forwarded only once the backend accepts them on claim submit. */
  password?: string
  other_socials?: InventorySocialLinks
  location?: string
  primary_genre?: string
  open_to_collab?: CollabOpenness
}

export interface InventoryClaimSubmitResponse {
  id: string
  username: string
  status: "pending"
  message: string
  discovery_source: DiscoverySource
  discovery_source_label?: string
  discovery_source_other?: string
  /** Password claims only: a session so the artist is signed in straight away. */
  token?: string
  expires_in?: number
  user?: {
    uid: string
    username: string
    name: string
    email_verified: boolean
  }
}

export interface ClaimConfirmEmailResponse {
  email: string
  username: string
  email_verified: true
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
  /** Account setup claims — omitted on legacy rows. */
  other_socials?: InventorySocialLinks
  location?: string
  primary_genre?: string
  open_to_collab?: CollabOpenness
  /** True when the claimant set a password at submit and can sign in right after approval. */
  has_password: boolean
  /** Pending claim whose email belongs to another Hiffi account; approving it fails with 409. */
  email_conflict: boolean
  /** `null` until the claimer confirms their email; absent on API builds without instant login. */
  email_confirmed_at?: string | null
  created_at: string
  updated_at: string
}

export interface ClaimEmailCheck {
  email: string
  available: boolean
  reason?: "email_in_use"
  message?: string
}

export interface InventoryClaimApproveResponse {
  claim: InventoryClaim
  rejected_count: number
  user_updated: boolean
  user_uid?: string
  email_sent: boolean
  /** True: artist signs in at /login. False: activation email → /claim/onboard. */
  account_ready: boolean
}

export interface InventoryClaimResendEmailResponse {
  claim: InventoryClaim
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

function optionalText(value: unknown): string | undefined {
  const raw = value != null ? String(value).trim() : ""
  return raw || undefined
}

const optionalTimestamp = optionalText

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
  const otherSocials = normalizeInventorySocials(raw)
  const location = optionalText(raw.location)
  const primaryGenre = optionalText(raw.primary_genre)
  const collab = String(raw.open_to_collab ?? "").trim().toLowerCase()

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
    ...(otherSocials && Object.keys(otherSocials).length > 0 ? { other_socials: otherSocials } : {}),
    ...(location ? { location } : {}),
    ...(primaryGenre ? { primary_genre: primaryGenre } : {}),
    ...(collab === "yes" || collab === "maybe" || collab === "no"
      ? { open_to_collab: collab as CollabOpenness }
      : {}),
    has_password: raw.has_password === true,
    email_conflict: raw.email_conflict === true,
    ...("email_confirmed_at" in raw
      ? { email_confirmed_at: optionalTimestamp(raw.email_confirmed_at) ?? null }
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
    account_ready: raw.account_ready === true,
  }
}

export function normalizeInventoryClaimResendEmailResponse(
  raw: Record<string, unknown>,
): InventoryClaimResendEmailResponse {
  const claimRaw =
    raw.claim && typeof raw.claim === "object" && !Array.isArray(raw.claim)
      ? (raw.claim as Record<string, unknown>)
      : {}

  return {
    claim: normalizeInventoryClaim(claimRaw),
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

  const city = normalizeInventoryCityRef(raw.city)
  const ranking = normalizePublicRanking(raw.ranking)

  return {
    username: String(raw.username ?? "").trim().toLowerCase(),
    artist_name: String(raw.artist_name ?? "").trim(),
    bio: raw.bio != null && String(raw.bio).trim() ? String(raw.bio).trim() : undefined,
    other_socials: normalizeInventorySocials(raw),
    location: raw.location != null && String(raw.location).trim() ? String(raw.location).trim() : undefined,
    ...(city ? { city } : {}),
    genre,
    banner_image: bannerImage,
    claim_status: normalizePublicClaimStatus(raw.claim_status),
    ...(ranking ? { ranking } : {}),
    ...(createdAt ? { created_at: createdAt } : {}),
    ...(updatedAt ? { updated_at: updatedAt } : {}),
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function positiveIntOrNull(value: unknown): number | null {
  const n = Number(value)
  return value != null && Number.isFinite(n) && n > 0 ? Math.round(n) : null
}

function numberOrNull(value: unknown): number | null {
  const n = Number(value)
  return value != null && value !== "" && Number.isFinite(n) ? n : null
}

const RANK_BANDS: RankBand[] = ["hiffi_500", "top_5", "top_10", "top_25", "none"]

function normalizeRankBand(value: unknown): RankBand {
  return RANK_BANDS.includes(value as RankBand) ? (value as RankBand) : "none"
}

export function normalizeInventoryCityRef(value: unknown): InventoryCityRef | null {
  const raw = asRecord(value)
  const id = String(raw?.id ?? "").trim()
  const label = String(raw?.label ?? "").trim()
  if (!raw || !id || !label) return null
  const region = String(raw.region ?? "").trim()
  return { id, label, ...(region ? { region } : {}), country: String(raw.country ?? "").trim() }
}

export function normalizePublicRanking(value: unknown): PublicRanking | undefined {
  const raw = asRecord(value)
  if (!raw) return undefined
  const status = raw.status === "ranked" ? "ranked" : "not_ranked"
  const band = status === "ranked" ? normalizeRankBand(raw.band) : "none"

  const highlightRaw = asRecord(raw.highlight)
  const highlightRank = positiveIntOrNull(highlightRaw?.rank)
  const highlightLabel = String(highlightRaw?.label ?? "").trim()
  const highlight =
    highlightRaw && highlightRank && highlightLabel
      ? {
          kind: highlightRaw.kind === "genre" ? ("genre" as const) : ("city" as const),
          label: highlightLabel,
          rank: highlightRank,
          total: positiveIntOrNull(highlightRaw.total) ?? 0,
        }
      : null

  const movementRaw = asRecord(raw.movement)
  const spots30d = positiveIntOrNull(movementRaw?.spots_30d)
  const streakWeeks = positiveIntOrNull(movementRaw?.streak_weeks)

  return {
    status,
    band,
    global_rank: band === "hiffi_500" ? positiveIntOrNull(raw.global_rank) : null,
    highlight,
    movement: spots30d || streakWeeks ? { spots_30d: spots30d, streak_weeks: streakWeeks } : null,
    updated_at: raw.updated_at ? String(raw.updated_at) : null,
  }
}

function normalizeOwnerRankGroup(value: unknown): OwnerRankGroup | null {
  const raw = asRecord(value)
  const id = String(raw?.id ?? "").trim()
  if (!raw || !id) return null
  return {
    id,
    label: String(raw.label ?? id).trim(),
    rank: positiveIntOrNull(raw.rank),
    total: positiveIntOrNull(raw.total) ?? 0,
  }
}

const HIFFI500_TIERS: Hiffi500Tier[] = ["global_velocity", "hot_50", "rising", "charting"]

export function normalizeOwnerRanking(raw: Record<string, unknown>): OwnerRanking {
  const nextRaw = asRecord(raw.next_band)
  const changeRaw = asRecord(raw.change)
  const driversRaw = asRecord(raw.drivers)
  const nextRankNeeded = positiveIntOrNull(nextRaw?.rank_needed)

  return {
    username: String(raw.username ?? "").trim().toLowerCase(),
    status: raw.status === "ranked" ? "ranked" : "not_ranked",
    global_rank: positiveIntOrNull(raw.global_rank),
    total_ranked: positiveIntOrNull(raw.total_ranked) ?? 0,
    percentile: numberOrNull(raw.percentile),
    band: normalizeRankBand(raw.band),
    next_band:
      nextRaw && nextRankNeeded
        ? {
            band: normalizeRankBand(nextRaw.band),
            ...(HIFFI500_TIERS.includes(nextRaw.tier as Hiffi500Tier)
              ? { tier: nextRaw.tier as Hiffi500Tier }
              : {}),
            rank_needed: nextRankNeeded,
            spots_away: Math.max(0, Math.round(Number(nextRaw.spots_away) || 0)),
          }
        : null,
    city: normalizeOwnerRankGroup(raw.city),
    genre: normalizeOwnerRankGroup(raw.genre),
    change: { d7: numberOrNull(changeRaw?.d7), d30: numberOrNull(changeRaw?.d30) },
    history: Array.isArray(raw.history)
      ? raw.history
          .map((entry) => asRecord(entry))
          .filter((entry): entry is Record<string, unknown> => Boolean(entry?.week))
          .map((entry) => ({ week: String(entry.week), global_rank: positiveIntOrNull(entry.global_rank) }))
      : [],
    drivers: {
      youtube_score: numberOrNull(driversRaw?.youtube_score),
      instagram_score: numberOrNull(driversRaw?.instagram_score),
      momentum_30d: numberOrNull(driversRaw?.momentum_30d),
    },
    updated_at: raw.updated_at ? String(raw.updated_at) : null,
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
