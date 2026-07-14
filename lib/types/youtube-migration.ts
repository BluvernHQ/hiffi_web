// Platforms supported by the migration-requests API
export type MigrationPlatform = "youtube" | "vimeo" | "twitch" | "other"

// Statuses from GET /migration-requests/config
export type MigrationRequestStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "rejected"
  | "completed"

// Local UI-only concept — serialised into the note field on submit
export type MigrationContentType =
  | "music_videos"
  | "audio_tracks"
  | "music_videos_and_audio"
  | "other"

// Shape returned by the API (user + admin routes)
export type MigrationRequest = {
  id: string
  requester_id: string
  platform: MigrationPlatform
  channel_url: string
  artist_name?: string | null
  note?: string | null
  verified_channel_id?: string | null
  verified_google_email?: string | null
  status: MigrationRequestStatus
  reference_id?: string | null
  admin_notes?: string | null
  resolved_at?: string | null
  created_at: string
  updated_at: string
}

// POST /migration-requests body
export type CreateMigrationRequestInput = {
  platform: MigrationPlatform
  channel_url: string
  artist_name?: string
  note?: string
  verified_channel_id?: string
  verified_google_email?: string
}

// PATCH /admin/migration-requests/{id} body
export type UpdateMigrationRequestInput = {
  status?: MigrationRequestStatus
  admin_notes?: string
}

// GET /migration-requests/config response data
export type MigrationConfig = {
  platforms: MigrationPlatform[]
  statuses: MigrationRequestStatus[]
}

// GET /admin/migration-requests query params
export type AdminListMigrationRequestsParams = {
  status?: MigrationRequestStatus
  platform?: MigrationPlatform
  requester_id?: string
  reference_id?: string
  limit?: number
  offset?: number
}

export const MIGRATION_CONTENT_TYPE_LABELS: Record<MigrationContentType, string> = {
  music_videos: "Music Videos",
  audio_tracks: "Audio Tracks",
  music_videos_and_audio: "Music Videos and Audio",
  other: "Other",
}

export const MIGRATION_STATUS_LABELS: Record<MigrationRequestStatus, string> = {
  pending: "Pending",
  under_review: "Under Review",
  approved: "Approved",
  completed: "Completed",
  rejected: "Rejected",
}

export const MIGRATION_PLATFORM_LABELS: Record<MigrationPlatform, string> = {
  youtube: "YouTube",
  vimeo: "Vimeo",
  twitch: "Twitch",
  other: "Other",
}

// Builds the note string sent to the API, prefixing content type when set
export function buildMigrationNote(
  contentType: MigrationContentType,
  userNote?: string,
): string {
  const label = MIGRATION_CONTENT_TYPE_LABELS[contentType]
  const base = `Content type: ${label}`
  const trimmedNote = userNote?.trim()
  return trimmedNote ? `${base}\n\n${trimmedNote}` : base
}
