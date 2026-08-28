export type CreatorStatus = "applied" | "approved" | "suspended"
export type CreatorUploadStatus = "has_uploads" | "never_uploaded"
export type CreatorClaimStatus = "pending" | "approved" | "rejected" | "none"
export type FunnelComparePeriod = "7d" | "30d"

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

export type FunnelStage = {
  count: number
  conversion: number | null
  window_days?: number
}

export type CreatorOverview = {
  as_of: string
  total_creators: number
  creators_with_uploads: number
  upload_rate: number
  new_creators_this_week: number
  never_uploaded: number
  active_7d: number
  active_30d: number
  median_days_to_first_upload: number | null
}

export type CreatorFunnel = {
  as_of: string
  applied: { pending_claims: number; pending_upgrades: number }
  approved: FunnelStage
  first_upload: FunnelStage
  active_uploader: FunnelStage
  retained: FunnelStage
  compare?: {
    period: FunnelComparePeriod
    as_of: string
    approved: number
    first_upload: number
    active_30d: number
    retained_30d: number
  }
}

export type AttentionSegment = { count: number; percentage: number }

export type CreatorAttention = {
  as_of: string
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
  new_creators: number
  never_uploaded: number
  active_7d: number
  active_30d: number
  active_60d: number
  active_90d: number
  retained_7d: number
  retained_30d: number
  retained_60d: number
  retained_90d: number
  first_uploads: number
  total_uploads: number
  median_days_to_first_upload?: number
}

export type CreatorTrends = {
  as_of: string
  daily: CreatorDailySnapshot[]
  new_creators_weekly: WeekBucket[]
  first_uploads_weekly: WeekBucket[]
  total_uploads_weekly: WeekBucket[]
}

/** Shared calendar param for overview / funnel / attention / trends (`YYYY-MM-DD` UTC). */
export type CreatorAsOfParams = {
  as_of?: string
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

export function isCreatorSegment(value: unknown): value is CreatorSegment {
  return typeof value === "string" && CREATOR_SEGMENTS.includes(value as CreatorSegment)
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : {}
}

function num(value: unknown, fallback = 0): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function optNum(value: unknown): number | null {
  if (value == null || value === "") return null
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

function stage(raw: unknown): FunnelStage {
  const r = asRecord(raw)
  const windowDays = optNum(r.window_days)
  return {
    count: num(r.count),
    conversion: optNum(r.conversion),
    ...(windowDays != null ? { window_days: windowDays } : {}),
  }
}

function attentionSeg(raw: unknown): AttentionSegment {
  const r = asRecord(raw)
  return { count: num(r.count), percentage: num(r.percentage) }
}

function weekBucket(raw: unknown): WeekBucket {
  const r = asRecord(raw)
  return { week: str(r.week), count: num(r.count) }
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

export function normalizeCreatorOverview(raw: unknown): CreatorOverview {
  const r = asRecord(raw)
  return {
    as_of: str(r.as_of),
    total_creators: num(r.total_creators),
    creators_with_uploads: num(r.creators_with_uploads),
    upload_rate: num(r.upload_rate),
    new_creators_this_week: num(r.new_creators_this_week),
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
  const funnel: CreatorFunnel = {
    as_of: str(r.as_of),
    applied: {
      pending_claims: num(applied.pending_claims),
      pending_upgrades: num(applied.pending_upgrades),
    },
    approved: stage(r.approved),
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
        approved: num(c.approved),
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
    as_of: str(r.as_of),
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

function dailySnapshot(raw: unknown): CreatorDailySnapshot {
  const r = asRecord(raw)
  const median = optNum(r.median_days_to_first_upload)
  return {
    day: str(r.day),
    total_creators: num(r.total_creators),
    creators_with_uploads: num(r.creators_with_uploads),
    upload_rate: num(r.upload_rate),
    new_creators: num(r.new_creators),
    never_uploaded: num(r.never_uploaded),
    active_7d: num(r.active_7d),
    active_30d: num(r.active_30d),
    active_60d: num(r.active_60d),
    active_90d: num(r.active_90d),
    retained_7d: num(r.retained_7d),
    retained_30d: num(r.retained_30d),
    retained_60d: num(r.retained_60d),
    retained_90d: num(r.retained_90d),
    first_uploads: num(r.first_uploads),
    total_uploads: num(r.total_uploads),
    ...(median != null ? { median_days_to_first_upload: median } : {}),
  }
}

export function normalizeCreatorTrends(raw: unknown): CreatorTrends {
  const r = asRecord(raw)
  return {
    as_of: str(r.as_of),
    daily: Array.isArray(r.daily) ? r.daily.map(dailySnapshot) : [],
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
