export type MigrationContentType =
  | "music_videos"
  | "audio_tracks"
  | "music_videos_and_audio"
  | "other"

export type MigrationRequestStatus =
  | "submitted"
  | "under_review"
  | "processing"
  | "completed"
  | "rejected"

export type YoutubeMigrationRequest = {
  id: string
  submittedAt: string
  youtubeUrl: string
  artistName?: string
  contentType: MigrationContentType
  status: MigrationRequestStatus
  note?: string
  googleVerified?: boolean
  verifiedChannelId?: string
  verifiedGoogleEmail?: string
}

export const MIGRATION_CONTENT_TYPE_LABELS: Record<MigrationContentType, string> = {
  music_videos: "Music Videos",
  audio_tracks: "Audio Tracks",
  music_videos_and_audio: "Music Videos and Audio",
  other: "Other",
}

export const MIGRATION_STATUS_LABELS: Record<MigrationRequestStatus, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  processing: "Processing",
  completed: "Completed",
  rejected: "Rejected",
}
