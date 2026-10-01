export type CreatorStatus = "applied" | "approved" | "suspended"
export type CreatorUploadStatus = "has_uploads" | "never_uploaded"
export type CreatorClaimStatus = "pending" | "approved" | "rejected" | "none"
export type FunnelComparePeriod = "7d" | "30d"
export type CreatorSource = "organic" | "inventory"
export type CreatorPopulation = "organic" | "claimed"

export type CreatorMetricsSection =
  | "growth"
  | "acquisition"
  | "activation"
  | "engagement"
  | "retention"
  | "content"
  | "quality"
  | "ops"
  | "cohorts"

export type CreatorSegment =
  | "never_uploaded"
  | "never_returned"
  | "stale"
  | "at_risk_30"
  | "at_risk_60"
  | "at_risk_90"
  | "new_without_upload"
  | "new_this_week"
  | "active_7d"
  | "active_30d"
  | "has_uploads"

/** Shared calendar for metric GETs. `to_date` preferred; `as_of` is an alias. */
export type CreatorDateRange = {
  from_date?: string
  to_date?: string
  /** @deprecated Prefer `to_date`. Kept for URL/back-compat. */
  as_of?: string
}

export type FunnelStage = {
  count: number
  conversion: number | null
  window_days?: number
}

export type CreatorOverview = {
  as_of: string
  to_date?: string
  from_date?: string
  population?: CreatorPopulation
  total_creators: number
  creators_with_uploads: number
  upload_rate: number
  /** Organic dashboard */
  new_creators_this_week: number
  /** Claimed dashboard — claim approve time */
  new_claims_this_week?: number
  never_uploaded: number
  active_7d: number
  active_30d: number
  median_days_to_first_upload: number | null
}

export type ClaimOnboarding = {
  awaiting_email: number
  email_sent: number
  link_opened: number
  activated: number
}

export type CreatorFunnel = {
  as_of: string
  to_date?: string
  from_date?: string
  population?: CreatorPopulation
  applied: { pending_claims: number; pending_upgrades: number }
  claim_onboarding: ClaimOnboarding
  /** Organic funnel stage */
  approved: FunnelStage
  /** Claimed funnel stage (population=claimed) */
  claimed?: FunnelStage
  first_upload: FunnelStage
  active_uploader: FunnelStage
  retained: FunnelStage
  compare?: {
    period: FunnelComparePeriod
    as_of: string
    approved?: number
    claimed?: number
    first_upload: number
    active_30d: number
    retained_30d: number
  }
}

export type AttentionSegment = {
  count: number
  percentage: number
}

export type CreatorAttention = {
  as_of: string
  to_date?: string
  from_date?: string
  population?: CreatorPopulation
  total_creators: number
  stale_days: number
  segments: {
    never_uploaded: AttentionSegment
    never_returned: AttentionSegment
    stale_uploaders: AttentionSegment
    at_risk_30: AttentionSegment
    at_risk_60: AttentionSegment
    at_risk_90: AttentionSegment
    new_creators_without_upload: AttentionSegment
  }
}

export type WeekBucket = { week: string; count: number }
export type MonthBucket = { month: string; count: number }

export type CreatorDailySnapshot = {
  day: string
  total_creators: number
  creators_with_uploads: number
  upload_rate: number
  active_30d: number
  new_creators?: number
  never_uploaded?: number
  active_7d?: number
  active_60d?: number
  active_90d?: number
  retained_7d?: number
  retained_30d?: number
  retained_60d?: number
  retained_90d?: number
  first_uploads?: number
  total_uploads?: number
  median_days_to_first_upload?: number
}

export type ClaimsDailySnapshot = {
  day: string
  pending: number
  approved: number
  rejected: number
  submitted: number
  awaiting_email: number
  email_sent: number
  link_opened: number
  activated: number
}

export type CreatorTrends = {
  as_of: string
  to_date?: string
  from_date?: string
  population?: CreatorPopulation
  daily: CreatorDailySnapshot[]
  claims_daily: ClaimsDailySnapshot[]
  new_creators_weekly: WeekBucket[]
  first_uploads_weekly: WeekBucket[]
  total_uploads_weekly: WeekBucket[]
}

export type CreatorAcquisition = {
  as_of: string
  to_date?: string
  from_date?: string
  population?: CreatorPopulation
  signups: number
  otp_applications: number
  claims: {
    pending: number
    approved: number
    rejected: number
    submitted?: number
  }
  discovery_mix: Array<{ label: string; count: number }>
  claim_onboarding: ClaimOnboarding
  median_hours_to_approve: number | null
  median_hours_to_activate: number | null
  median_days_to_activate: number | null
}

export type CreatorActivation = {
  as_of: string
  to_date?: string
  from_date?: string
  population?: CreatorPopulation
  total_creators: number
  creators_with_uploads: number
  never_uploaded: number
  new_creators_without_upload: number
  first_upload_rate: number
  median_days_to_first_upload: number | null
  p90_days_to_first_upload: number | null
  profile_completion: {
    has_bio: number
    has_profile_picture: number
    has_genre: number
    has_location: number
    has_socials: number
    all_fields: number
  }
}

export type CreatorEngagement = {
  as_of: string
  to_date?: string
  from_date?: string
  population?: CreatorPopulation
  stale_days: number
  active_1d: number
  active_7d: number
  active_30d: number
  active_60d: number
  active_90d: number
  active_uploaders: number
  upload_volume: number
  never_returned: number
  stale_uploaders: number
  at_risk_30: number
  at_risk_60: number
  at_risk_90: number
  uploads_per_creator: number
  return_rate: number | null
}

export type CreatorRetention = {
  as_of: string
  to_date?: string
  from_date?: string
  population?: CreatorPopulation
  retained_7d: number
  retained_30d: number
  retained_60d: number
  retained_90d: number
  churned_30d: number
  reactivated: number
}

export type CreatorContent = {
  as_of: string
  to_date?: string
  from_date?: string
  population?: CreatorPopulation
  videos_ready: number
  videos_hidden: number
  videos_encoding: number
  avg_videos_per_creator: number | null
  buckets: {
    one_video: number
    two_to_five: number
    ten_plus: number
  }
  upload_frequency_30d: number | null
  flags: number
}

export type CreatorQuality = {
  as_of: string
  to_date?: string
  from_date?: string
  population?: CreatorPopulation
  upload_rate: number
  conversions: {
    first_upload_vs_approved: number
  }
  top_cities: Array<{ label: string; count: number }>
  top_genres: Array<{ label: string; count: number }>
  followers_buckets: {
    zero: number
    one_to_nine: number
    ten_to_99: number
    hundred_plus: number
  }
}

export type CreatorOps = {
  as_of: string
  to_date?: string
  from_date?: string
  population?: CreatorPopulation
  pending_claims: { count: number; avg_age_days: number | null; max_age_days: number | null }
  pending_otp_upgrades: number
  suspended: number
  email_failures: number
  onboarding_stuck: {
    email_sent_no_verify_3d: number
    verified_no_password_3d: number
  }
}

export type CohortRow = {
  week: string
  cohort_size: number
  retained_30d: number
  retention_rate: number
}

export type CreatorCohorts = {
  as_of: string
  to_date?: string
  from_date?: string
  population?: CreatorPopulation
  by_approval_week: CohortRow[]
  by_claim_approve_week: CohortRow[]
  by_claim_activate_week: CohortRow[]
}

export type CreatorDirectoryRow = {
  uid: string
  username: string
  name: string
  profile_picture?: string
  role: string
  followers: number
  videos: number
  disabled: boolean
  joined: string
  creator_status: CreatorStatus | string
  source?: CreatorSource | string
  city?: string
  genre?: string
  claim_status?: CreatorClaimStatus | string
  approved_at?: string
  last_upload?: string
  last_activity?: string
}

export type CreatorDirectoryResponse = {
  creators: CreatorDirectoryRow[]
  limit: number
  offset: number
  count: number
  has_more: boolean
}

export type CreatorListParams = {
  limit?: number
  offset?: number
  status?: CreatorStatus
  upload_status?: CreatorUploadStatus
  segment?: CreatorSegment
  city?: string
  genre?: string
  claim_status?: CreatorClaimStatus
  stale_days?: number
}

export type CreatorVideoRow = {
  video_id: string
  video_title: string
  video_thumbnail?: string
  status: string
  created_at: string
}

export type CreatorApplication = {
  id: string
  source: string
  status: string
  otp_id?: string
  created_at: string
  expires_at?: string
  decided_at?: string
}

export type CreatorFlagRow = {
  id: string
  report_type: string
  target_id: string
  target_type: string
  reporter_id: string
  reason: string
  status: string
  reference_id: string
  created_at: string
  updated_at: string
}

export type CreatorDetail = {
  profile: {
    uid: string
    username: string
    name: string
    profile_picture?: string
    bio?: string
    email?: string
    genre?: string
    city?: string
    creator_status: CreatorStatus | string
    role: string
    followers: number
    disabled: boolean
    source?: CreatorSource | string
    claim_status?: string | null
    applied_at?: string
    approved_at?: string
    suspended_at?: string | null
    created_at: string
  }
  activity_summary: {
    total_videos: number
    first_upload?: string
    last_upload?: string
    last_login?: string
    last_activity?: string
    days_since_last_upload?: number | null
    days_since_last_activity?: number | null
  }
  upload_activity: {
    timeline: WeekBucket[]
    timeline_weekly: WeekBucket[]
    timeline_monthly: MonthBucket[]
    recent_videos: CreatorVideoRow[]
    encoding_videos: CreatorVideoRow[]
  }
  applications: CreatorApplication[]
  flags: CreatorFlagRow[]
}

export const CREATOR_SEGMENTS: CreatorSegment[] = [
  "never_uploaded",
  "never_returned",
  "stale",
  "at_risk_30",
  "at_risk_60",
  "at_risk_90",
  "new_without_upload",
  "new_this_week",
  "active_7d",
  "active_30d",
  "has_uploads",
]

export const CREATOR_SEGMENT_LABELS: Record<CreatorSegment, string> = {
  never_uploaded: "Never uploaded",
  never_returned: "Never returned",
  stale: "Stale uploaders",
  at_risk_30: "At risk · 30d",
  at_risk_60: "At risk · 60d",
  at_risk_90: "At risk · 90d",
  new_without_upload: "New without upload",
  new_this_week: "New this week",
  active_7d: "Active 7 days",
  active_30d: "Active 30 days",
  has_uploads: "Has uploads",
}

export const CREATOR_METRICS_SECTIONS: CreatorMetricsSection[] = [
  "growth",
  "acquisition",
  "activation",
  "engagement",
  "retention",
  "content",
  "quality",
  "ops",
  "cohorts",
]

/**
 * Organic `/admin/creators/{section}` paths for acquisition…cohorts collide with
 * `GET /admin/creators/{username}` on current backends ("Creator not found").
 * Growth uses overview/funnel/attention/trends which are registered.
 * Extended sections are under `/admin/creators/claimed/*`.
 */
export const CREATOR_METRICS_SECTIONS_ORGANIC: CreatorMetricsSection[] = ["growth"]

export const CREATOR_METRICS_SECTIONS_CLAIMED: CreatorMetricsSection[] = CREATOR_METRICS_SECTIONS

export function metricsSectionsForPopulation(
  population: CreatorPopulation,
): CreatorMetricsSection[] {
  return population === "claimed"
    ? CREATOR_METRICS_SECTIONS_CLAIMED
    : CREATOR_METRICS_SECTIONS_ORGANIC
}

export const CREATOR_METRICS_SECTION_LABELS: Record<CreatorMetricsSection, string> = {
  growth: "Growth",
  acquisition: "Acquisition",
  activation: "Activation",
  engagement: "Engagement",
  retention: "Retention",
  content: "Content",
  quality: "Quality",
  ops: "Ops",
  cohorts: "Cohorts",
}

export const CREATOR_POPULATIONS: CreatorPopulation[] = ["organic", "claimed"]

export const CREATOR_POPULATION_LABELS: Record<CreatorPopulation, string> = {
  organic: "Organic",
  claimed: "Claimed",
}

export function isCreatorSegment(value: unknown): value is CreatorSegment {
  return typeof value === "string" && CREATOR_SEGMENTS.includes(value as CreatorSegment)
}

export function isCreatorMetricsSection(value: unknown): value is CreatorMetricsSection {
  return (
    typeof value === "string" &&
    CREATOR_METRICS_SECTIONS.includes(value as CreatorMetricsSection)
  )
}

export function isCreatorPopulation(value: unknown): value is CreatorPopulation {
  return value === "organic" || value === "claimed"
}

export function isCreatorSource(value: unknown): value is CreatorSource {
  return value === "organic" || value === "inventory"
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : {}
}

function num(value: unknown, fallback = 0): number {
  if (value !== null && typeof value === "object") {
    const r = value as Record<string, unknown>
    if (r.total != null) return num(r.total, fallback)
  }
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function optNum(value: unknown): number | null {
  if (value == null || value === "") return null
  if (value !== null && typeof value === "object") {
    const r = value as Record<string, unknown>
    if (r.total != null) return optNum(r.total)
  }
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback
}

function optStr(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined
}

function bool(value: unknown): boolean {
  return value === true
}

function dateMeta(r: Record<string, unknown>) {
  return {
    as_of: str(r.as_of) || str(r.to_date),
    ...(optStr(r.to_date) ? { to_date: str(r.to_date) } : {}),
    ...(optStr(r.from_date) ? { from_date: str(r.from_date) } : {}),
    ...(r.population === "claimed" || r.population === "organic"
      ? { population: r.population as CreatorPopulation }
      : {}),
  }
}

function stage(raw: unknown): FunnelStage {
  const r = asRecord(raw)
  const windowDays = optNum(r.window_days)
  const conversionRaw = r.conversion
  return {
    count: num(r.count),
    conversion:
      conversionRaw == null || conversionRaw === "" ? null : num(conversionRaw),
    ...(windowDays != null ? { window_days: windowDays } : {}),
  }
}

function attentionSeg(raw: unknown): AttentionSegment {
  const r = asRecord(raw)
  return {
    count: num(r.count),
    percentage: num(r.percentage),
  }
}

function weekBucket(raw: unknown): WeekBucket {
  const r = asRecord(raw)
  return { week: str(r.week), count: num(r.count ?? r.total) }
}

function monthBucket(raw: unknown): MonthBucket {
  const r = asRecord(raw)
  return { month: str(r.month), count: num(r.count) }
}

function videoRow(raw: unknown): CreatorVideoRow {
  const r = asRecord(raw)
  return {
    video_id: str(r.video_id),
    video_title: str(r.video_title, "Untitled"),
    video_thumbnail: optStr(r.video_thumbnail) || optStr(r.videoThumbnail),
    status: str(r.status),
    created_at: str(r.created_at),
  }
}

function claimOnboarding(raw: unknown): ClaimOnboarding {
  const r = asRecord(raw)
  return {
    awaiting_email: num(r.awaiting_email),
    email_sent: num(r.email_sent),
    link_opened: num(r.link_opened),
    activated: num(r.activated),
  }
}

function dailySnapshot(raw: unknown): CreatorDailySnapshot {
  const r = asRecord(raw)
  // Legacy nested SplitInt daily → flatten via total
  const slice =
    r.total != null && typeof r.total === "object" ? asRecord(r.total) : r
  const median = optNum(slice.median_days_to_first_upload)
  return {
    day: str(r.day),
    total_creators: num(slice.total_creators),
    creators_with_uploads: num(slice.creators_with_uploads),
    upload_rate: num(slice.upload_rate),
    active_30d: num(slice.active_30d),
    ...(slice.new_creators != null ? { new_creators: num(slice.new_creators) } : {}),
    ...(slice.never_uploaded != null ? { never_uploaded: num(slice.never_uploaded) } : {}),
    ...(slice.active_7d != null ? { active_7d: num(slice.active_7d) } : {}),
    ...(slice.active_60d != null ? { active_60d: num(slice.active_60d) } : {}),
    ...(slice.active_90d != null ? { active_90d: num(slice.active_90d) } : {}),
    ...(slice.retained_7d != null ? { retained_7d: num(slice.retained_7d) } : {}),
    ...(slice.retained_30d != null ? { retained_30d: num(slice.retained_30d) } : {}),
    ...(slice.retained_60d != null ? { retained_60d: num(slice.retained_60d) } : {}),
    ...(slice.retained_90d != null ? { retained_90d: num(slice.retained_90d) } : {}),
    ...(slice.first_uploads != null ? { first_uploads: num(slice.first_uploads) } : {}),
    ...(slice.total_uploads != null ? { total_uploads: num(slice.total_uploads) } : {}),
    ...(median != null ? { median_days_to_first_upload: median } : {}),
  }
}

function claimsDaily(raw: unknown): ClaimsDailySnapshot {
  const r = asRecord(raw)
  return {
    day: str(r.day),
    pending: num(r.pending),
    approved: num(r.approved),
    rejected: num(r.rejected),
    submitted: num(r.submitted),
    awaiting_email: num(r.awaiting_email),
    email_sent: num(r.email_sent),
    link_opened: num(r.link_opened),
    activated: num(r.activated),
  }
}

function labelCountRow(raw: unknown): { label: string; count: number } {
  const r = asRecord(raw)
  return {
    label: str(r.label) || str(r.source) || str(r.key) || "Unknown",
    count: num(r.count ?? r.total),
  }
}

function cohortRow(raw: unknown): CohortRow {
  const r = asRecord(raw)
  return {
    week: str(r.week),
    cohort_size: num(r.cohort_size),
    retained_30d: num(r.retained_30d),
    retention_rate: num(r.retention_rate),
  }
}

export function normalizeCreatorOverview(raw: unknown): CreatorOverview {
  const r = asRecord(raw)
  return {
    ...dateMeta(r),
    total_creators: num(r.total_creators),
    creators_with_uploads: num(r.creators_with_uploads),
    upload_rate: num(r.upload_rate),
    new_creators_this_week: num(r.new_creators_this_week ?? r.new_claims_this_week),
    ...(r.new_claims_this_week != null
      ? { new_claims_this_week: num(r.new_claims_this_week) }
      : {}),
    never_uploaded: num(r.never_uploaded),
    active_7d: num(r.active_7d),
    active_30d: num(r.active_30d),
    median_days_to_first_upload: optNum(r.median_days_to_first_upload),
  }
}

export function normalizeCreatorFunnel(raw: unknown): CreatorFunnel {
  const r = asRecord(raw)
  const applied = asRecord(r.applied)
  const compareRaw = r.compare
  const approvedStage = r.approved != null ? stage(r.approved) : undefined
  const claimedStage = r.claimed != null ? stage(r.claimed) : undefined
  const funnel: CreatorFunnel = {
    ...dateMeta(r),
    applied: {
      pending_claims: num(applied.pending_claims),
      pending_upgrades: num(applied.pending_upgrades),
    },
    claim_onboarding: claimOnboarding(r.claim_onboarding),
    approved: approvedStage ?? claimedStage ?? { count: 0, conversion: null },
    ...(claimedStage ? { claimed: claimedStage } : {}),
    first_upload: stage(r.first_upload),
    active_uploader: stage(r.active_uploader),
    retained: stage(r.retained),
  }
  if (compareRaw && typeof compareRaw === "object") {
    const c = asRecord(compareRaw)
    const period = c.period === "30d" ? "30d" : c.period === "7d" ? "7d" : null
    if (period) {
      funnel.compare = {
        period,
        as_of: str(c.as_of),
        ...(c.approved != null ? { approved: num(c.approved) } : {}),
        ...(c.claimed != null ? { claimed: num(c.claimed) } : {}),
        first_upload: num(c.first_upload),
        active_30d: num(c.active_30d),
        retained_30d: num(c.retained_30d),
      }
    }
  }
  return funnel
}

export function normalizeCreatorAttention(raw: unknown): CreatorAttention {
  const r = asRecord(raw)
  const s = asRecord(r.segments)
  return {
    ...dateMeta(r),
    total_creators: num(r.total_creators),
    stale_days: num(r.stale_days, 14),
    segments: {
      never_uploaded: attentionSeg(s.never_uploaded),
      never_returned: attentionSeg(s.never_returned),
      stale_uploaders: attentionSeg(s.stale_uploaders),
      at_risk_30: attentionSeg(s.at_risk_30),
      at_risk_60: attentionSeg(s.at_risk_60),
      at_risk_90: attentionSeg(s.at_risk_90),
      new_creators_without_upload: attentionSeg(s.new_creators_without_upload),
    },
  }
}

export function normalizeCreatorTrends(raw: unknown): CreatorTrends {
  const r = asRecord(raw)
  return {
    ...dateMeta(r),
    daily: Array.isArray(r.daily) ? r.daily.map(dailySnapshot) : [],
    claims_daily: Array.isArray(r.claims_daily) ? r.claims_daily.map(claimsDaily) : [],
    new_creators_weekly: Array.isArray(r.new_creators_weekly)
      ? r.new_creators_weekly.map(weekBucket)
      : [],
    first_uploads_weekly: Array.isArray(r.first_uploads_weekly)
      ? r.first_uploads_weekly.map(weekBucket)
      : [],
    total_uploads_weekly: Array.isArray(r.total_uploads_weekly)
      ? r.total_uploads_weekly.map(weekBucket)
      : [],
  }
}

export function normalizeCreatorAcquisition(raw: unknown): CreatorAcquisition {
  const r = asRecord(raw)
  const claims = asRecord(r.claims)
  return {
    ...dateMeta(r),
    signups: num(r.signups),
    otp_applications: num(r.otp_applications),
    claims: {
      pending: num(claims.pending),
      approved: num(claims.approved),
      rejected: num(claims.rejected),
      ...(claims.submitted != null ? { submitted: num(claims.submitted) } : {}),
    },
    discovery_mix: Array.isArray(r.discovery_mix) ? r.discovery_mix.map(labelCountRow) : [],
    claim_onboarding: claimOnboarding(r.claim_onboarding),
    median_hours_to_approve: optNum(r.median_hours_to_approve),
    median_hours_to_activate: optNum(r.median_hours_to_activate),
    median_days_to_activate: optNum(r.median_days_to_activate),
  }
}

export function normalizeCreatorActivation(raw: unknown): CreatorActivation {
  const r = asRecord(raw)
  const pc = asRecord(r.profile_completion)
  return {
    ...dateMeta(r),
    total_creators: num(r.total_creators),
    creators_with_uploads: num(r.creators_with_uploads),
    never_uploaded: num(r.never_uploaded),
    new_creators_without_upload: num(r.new_creators_without_upload),
    first_upload_rate: num(r.first_upload_rate),
    median_days_to_first_upload: optNum(r.median_days_to_first_upload),
    p90_days_to_first_upload: optNum(r.p90_days_to_first_upload),
    profile_completion: {
      has_bio: num(pc.has_bio),
      has_profile_picture: num(pc.has_profile_picture),
      has_genre: num(pc.has_genre),
      has_location: num(pc.has_location),
      has_socials: num(pc.has_socials),
      all_fields: num(pc.all_fields),
    },
  }
}

export function normalizeCreatorEngagement(raw: unknown): CreatorEngagement {
  const r = asRecord(raw)
  return {
    ...dateMeta(r),
    stale_days: num(r.stale_days, 14),
    active_1d: num(r.active_1d),
    active_7d: num(r.active_7d),
    active_30d: num(r.active_30d),
    active_60d: num(r.active_60d),
    active_90d: num(r.active_90d),
    active_uploaders: num(r.active_uploaders),
    upload_volume: num(r.upload_volume),
    never_returned: num(r.never_returned),
    stale_uploaders: num(r.stale_uploaders),
    at_risk_30: num(r.at_risk_30),
    at_risk_60: num(r.at_risk_60),
    at_risk_90: num(r.at_risk_90),
    uploads_per_creator: num(r.uploads_per_creator),
    return_rate: optNum(r.return_rate),
  }
}

export function normalizeCreatorRetention(raw: unknown): CreatorRetention {
  const r = asRecord(raw)
  return {
    ...dateMeta(r),
    retained_7d: num(r.retained_7d),
    retained_30d: num(r.retained_30d),
    retained_60d: num(r.retained_60d),
    retained_90d: num(r.retained_90d),
    churned_30d: num(r.churned_30d),
    reactivated: num(r.reactivated),
  }
}

export function normalizeCreatorContent(raw: unknown): CreatorContent {
  const r = asRecord(raw)
  const buckets = asRecord(r.buckets)
  const freq = r.upload_frequency_30d
  let uploadFrequency: number | null = null
  if (freq != null && typeof freq === "object") {
    const f = asRecord(freq)
    uploadFrequency = optNum(f.total ?? f.organic ?? f.inventory)
  } else {
    uploadFrequency = optNum(freq)
  }
  return {
    ...dateMeta(r),
    videos_ready: num(r.videos_ready),
    videos_hidden: num(r.videos_hidden),
    videos_encoding: num(r.videos_encoding),
    avg_videos_per_creator: optNum(r.avg_videos_per_creator),
    buckets: {
      one_video: num(buckets.one_video),
      two_to_five: num(buckets.two_to_five),
      ten_plus: num(buckets.ten_plus),
    },
    upload_frequency_30d: uploadFrequency,
    flags: num(r.flags),
  }
}

export function normalizeCreatorQuality(raw: unknown): CreatorQuality {
  const r = asRecord(raw)
  const conversions = asRecord(r.conversions)
  const followers = asRecord(r.followers_buckets)
  return {
    ...dateMeta(r),
    upload_rate: num(r.upload_rate),
    conversions: {
      first_upload_vs_approved: num(conversions.first_upload_vs_approved),
    },
    top_cities: Array.isArray(r.top_cities) ? r.top_cities.map(labelCountRow) : [],
    top_genres: Array.isArray(r.top_genres) ? r.top_genres.map(labelCountRow) : [],
    followers_buckets: {
      zero: num(followers.zero),
      one_to_nine: num(followers.one_to_nine),
      ten_to_99: num(followers.ten_to_99),
      hundred_plus: num(followers.hundred_plus),
    },
  }
}

export function normalizeCreatorOps(raw: unknown): CreatorOps {
  const r = asRecord(raw)
  const pending = asRecord(r.pending_claims)
  const stuck = asRecord(r.onboarding_stuck)
  return {
    ...dateMeta(r),
    pending_claims: {
      count: num(pending.count),
      avg_age_days: optNum(pending.avg_age_days),
      max_age_days: optNum(pending.max_age_days),
    },
    pending_otp_upgrades: num(r.pending_otp_upgrades),
    suspended: num(r.suspended),
    email_failures: num(r.email_failures),
    onboarding_stuck: {
      email_sent_no_verify_3d: num(stuck.email_sent_no_verify_3d),
      verified_no_password_3d: num(stuck.verified_no_password_3d),
    },
  }
}

export function normalizeCreatorCohorts(raw: unknown): CreatorCohorts {
  const r = asRecord(raw)
  return {
    ...dateMeta(r),
    by_approval_week: Array.isArray(r.by_approval_week)
      ? r.by_approval_week.map(cohortRow)
      : [],
    by_claim_approve_week: Array.isArray(r.by_claim_approve_week)
      ? r.by_claim_approve_week.map(cohortRow)
      : [],
    by_claim_activate_week: Array.isArray(r.by_claim_activate_week)
      ? r.by_claim_activate_week.map(cohortRow)
      : [],
  }
}

export function normalizeCreatorDirectoryRow(raw: unknown): CreatorDirectoryRow {
  const r = asRecord(raw)
  return {
    uid: str(r.uid),
    username: str(r.username),
    name: str(r.name) || str(r.username),
    profile_picture: optStr(r.profile_picture),
    role: str(r.role),
    followers: num(r.followers),
    videos: num(r.videos),
    disabled: bool(r.disabled),
    joined: str(r.joined),
    creator_status: str(r.creator_status, "approved"),
    source: optStr(r.source),
    city: optStr(r.city),
    genre: optStr(r.genre),
    claim_status: optStr(r.claim_status),
    approved_at: optStr(r.approved_at),
    last_upload: optStr(r.last_upload),
    last_activity: optStr(r.last_activity),
  }
}

export function normalizeCreatorDirectory(raw: unknown): CreatorDirectoryResponse {
  const r = asRecord(raw)
  const creators = Array.isArray(r.creators) ? r.creators.map(normalizeCreatorDirectoryRow) : []
  return {
    creators,
    limit: num(r.limit, 20),
    offset: num(r.offset),
    count: num(r.count, creators.length),
    has_more: Boolean(r.has_more),
  }
}

export function normalizeCreatorDetail(raw: unknown): CreatorDetail {
  const r = asRecord(raw)
  const profile = asRecord(r.profile)
  const summary = asRecord(r.activity_summary)
  const upload = asRecord(r.upload_activity)
  const weekly = Array.isArray(upload.timeline_weekly)
    ? upload.timeline_weekly.map(weekBucket)
    : Array.isArray(upload.timeline)
      ? upload.timeline.map(weekBucket)
      : []
  return {
    profile: {
      uid: str(profile.uid),
      username: str(profile.username),
      name: str(profile.name) || str(profile.username),
      profile_picture: optStr(profile.profile_picture),
      bio: optStr(profile.bio),
      email: optStr(profile.email),
      genre: optStr(profile.genre),
      city: optStr(profile.city),
      creator_status: str(profile.creator_status, "approved"),
      role: str(profile.role),
      followers: num(profile.followers),
      disabled: bool(profile.disabled),
      source: optStr(profile.source),
      claim_status: profile.claim_status == null ? null : str(profile.claim_status),
      applied_at: optStr(profile.applied_at),
      approved_at: optStr(profile.approved_at),
      suspended_at: optStr(profile.suspended_at) ?? null,
      created_at: str(profile.created_at),
    },
    activity_summary: {
      total_videos: num(summary.total_videos),
      first_upload: optStr(summary.first_upload),
      last_upload: optStr(summary.last_upload),
      last_login: optStr(summary.last_login),
      last_activity: optStr(summary.last_activity),
      days_since_last_upload: optNum(summary.days_since_last_upload),
      days_since_last_activity: optNum(summary.days_since_last_activity),
    },
    upload_activity: {
      timeline: weekly,
      timeline_weekly: weekly,
      timeline_monthly: Array.isArray(upload.timeline_monthly)
        ? upload.timeline_monthly.map(monthBucket)
        : [],
      recent_videos: Array.isArray(upload.recent_videos) ? upload.recent_videos.map(videoRow) : [],
      encoding_videos: Array.isArray(upload.encoding_videos)
        ? upload.encoding_videos.map(videoRow)
        : [],
    },
    applications: Array.isArray(r.applications)
      ? r.applications.map((item) => {
          const a = asRecord(item)
          return {
            id: str(a.id),
            source: str(a.source),
            status: str(a.status),
            otp_id: optStr(a.otp_id),
            created_at: str(a.created_at),
            expires_at: optStr(a.expires_at),
            decided_at: optStr(a.decided_at),
          }
        })
      : [],
    flags: Array.isArray(r.flags)
      ? r.flags.map((item) => {
          const f = asRecord(item)
          return {
            id: str(f.id),
            report_type: str(f.report_type),
            target_id: str(f.target_id),
            target_type: str(f.target_type),
            reporter_id: str(f.reporter_id),
            reason: str(f.reason),
            status: str(f.status),
            reference_id: str(f.reference_id),
            created_at: str(f.created_at),
            updated_at: str(f.updated_at),
          }
        })
      : [],
  }
}
