import type { YoutubeMigrationRequest } from "@/lib/types/youtube-migration"

export const MIGRATION_REQUESTS_STORAGE_KEY = "hiffi_youtube_migration_requests"
export const MIGRATION_REQUESTS_SECTION_ID = "migration-requests"
export const MIGRATION_REQUESTS_STUDIO_URL = `/upload#${MIGRATION_REQUESTS_SECTION_ID}`

export function loadMigrationRequests(): YoutubeMigrationRequest[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(MIGRATION_REQUESTS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as YoutubeMigrationRequest[]) : []
  } catch {
    return []
  }
}

export function saveMigrationRequests(requests: YoutubeMigrationRequest[]): void {
  try {
    window.localStorage.setItem(MIGRATION_REQUESTS_STORAGE_KEY, JSON.stringify(requests))
  } catch {
    // Ignore quota / private mode errors
  }
}

export function appendMigrationRequest(request: YoutubeMigrationRequest): YoutubeMigrationRequest[] {
  const next = [request, ...loadMigrationRequests()]
  saveMigrationRequests(next)
  return next
}
