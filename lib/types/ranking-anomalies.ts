export type RankingAnomalyIssueType =
  | "rank_jump"
  | "momentum_7d_spike"
  | "momentum_30d_spike"
  | "momentum_90d_spike"

export type RankingAnomalySource = "refresh" | "scan"

export interface RankingVersion {
  id: string
  version: number
  cycle_at: string
  ranked_count: number
  source: RankingAnomalySource
}

export interface RankingAnomaly {
  id: string
  username: string
  issue_type: RankingAnomalyIssueType
  old_value: number | null
  new_value: number | null
  delta: number
  youtube_score?: number | null
  source: RankingAnomalySource
  ranking_version_id?: string
  ranking_version?: number
  ranking_cycle_at?: string
  detected_at: string
}

export interface RankingAnomalyClosure extends RankingAnomaly {
  anomaly_id: string
  closed_at: string
  closed_by_admin_id: string
  notes: string
}

export interface RankingAnomalyListResponse {
  items: RankingAnomaly[]
  limit: number
  offset: number
  count: number
  has_more: boolean
}

export interface RankingAnomalyClosureListResponse {
  items: RankingAnomalyClosure[]
  limit: number
  offset: number
  count: number
  has_more: boolean
}

export interface RankingVersionListResponse {
  items: RankingVersion[]
  limit: number
  offset: number
  count: number
  has_more: boolean
}

export interface RankingAnomalyScanResult {
  opened: number
  scanned: number
}

export const RANKING_ANOMALY_ISSUE_LABELS: Record<RankingAnomalyIssueType, string> = {
  rank_jump: "Rank jump",
  momentum_7d_spike: "7d momentum spike",
  momentum_30d_spike: "30d momentum spike",
  momentum_90d_spike: "90d momentum spike",
}

export function isRankingAnomalyIssueType(value: unknown): value is RankingAnomalyIssueType {
  return (
    value === "rank_jump" ||
    value === "momentum_7d_spike" ||
    value === "momentum_30d_spike" ||
    value === "momentum_90d_spike"
  )
}

function toNullableNumber(value: unknown): number | null {
  if (value == null || value === "") return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function toOptionalNumber(value: unknown): number | undefined {
  if (value == null || value === "") return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

function toOptionalString(value: unknown): string | undefined {
  if (value == null || value === "") return undefined
  return String(value)
}

export function normalizeRankingVersion(raw: Record<string, unknown>): RankingVersion {
  return {
    id: String(raw.id ?? ""),
    version: toNumber(raw.version),
    cycle_at: String(raw.cycle_at ?? ""),
    ranked_count: toNumber(raw.ranked_count),
    source: raw.source === "scan" ? "scan" : "refresh",
  }
}

export function normalizeRankingAnomaly(raw: Record<string, unknown>): RankingAnomaly {
  const issueType = isRankingAnomalyIssueType(raw.issue_type) ? raw.issue_type : "rank_jump"
  const source = raw.source === "scan" ? "scan" : "refresh"
  return {
    id: String(raw.id ?? ""),
    username: String(raw.username ?? ""),
    issue_type: issueType,
    old_value: toNullableNumber(raw.old_value),
    new_value: toNullableNumber(raw.new_value),
    delta: toNumber(raw.delta),
    youtube_score: toNullableNumber(raw.youtube_score),
    source,
    ranking_version_id: toOptionalString(raw.ranking_version_id),
    ranking_version: toOptionalNumber(raw.ranking_version),
    ranking_cycle_at: toOptionalString(raw.ranking_cycle_at),
    detected_at: String(raw.detected_at ?? ""),
  }
}

export function normalizeRankingAnomalyClosure(raw: Record<string, unknown>): RankingAnomalyClosure {
  const base = normalizeRankingAnomaly(raw)
  return {
    ...base,
    anomaly_id: String(raw.anomaly_id ?? raw.id ?? ""),
    closed_at: String(raw.closed_at ?? ""),
    closed_by_admin_id: String(raw.closed_by_admin_id ?? ""),
    notes: String(raw.notes ?? ""),
  }
}
