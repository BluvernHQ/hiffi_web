/** Phase-1 report types surfaced in the UI */
export type Phase1ReportType = "video" | "comment" | "user"

export type ContentFlagStatus =
  | "pending"
  | "under_review"
  | "open"
  | "escalated"
  | "resolved"
  | "dismissed"
  | "closed"

export interface ContentFlag {
  id: string
  report_type: string
  target_id: string
  target_type: string
  reporter_id: string
  reason: string
  description?: string | null
  status: ContentFlagStatus
  metadata?: Record<string, unknown>
  attachments?: string[]
  reference_id: string
  moderator_id?: string | null
  resolution_notes?: string | null
  created_at: string
  updated_at: string
  resolved_at?: string | null
}

export interface ReportTypeConfig {
  reasons: string[]
  max_description_length: number
}

export interface FlagsConfigResponse {
  report_types: string[]
  statuses: string[]
  config: Record<string, ReportTypeConfig>
}

export interface CreateContentFlagInput {
  report_type: Phase1ReportType
  target_id: string
  target_type: string
  reason: string
  description?: string
  metadata?: Record<string, unknown>
  attachments?: string[]
}

export interface ContentFlagsListResult {
  flags: ContentFlag[]
  limit: number
  offset: number
}

export interface AdminListContentFlagsParams {
  status?: string
  report_type?: string
  reporter_id?: string
  target_id?: string
  target_type?: string
  reference_id?: string
  limit?: number
  offset?: number
}

export interface UpdateContentFlagInput {
  status?: ContentFlagStatus
  resolution_notes?: string
}
