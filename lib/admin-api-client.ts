import { getApiBaseUrl } from "./config"
import type { ApiError } from "./api-client"
import type { AdminApiClientContext } from "./api/context"
import type { AdminSession } from "./auth/admin-types"
import { isValidAdminSession } from "./auth/admin-types"
import {
  adminLogin as authAdminLogin,
  adminVerifyInvite as authAdminVerifyInvite,
  adminRequestPasswordReset,
  adminVerifyPasswordReset,
  type AdminLoginResponse,
} from "./api/admin-auth"
import {
  adminListUsers as apiAdminListUsers,
  adminListVideos as apiAdminListVideos,
  adminListComments as apiAdminListComments,
  adminListReplies as apiAdminListReplies,
  adminCounters as apiAdminCounters,
  adminResyncCounters as apiAdminResyncCounters,
  adminListFollowers as apiAdminListFollowers,
  adminListSearches as apiAdminListSearches,
  adminDisableUser as apiAdminDisableUser,
  adminEnableUser as apiAdminEnableUser,
  adminGetAnalyticsEvents as apiAdminGetAnalyticsEvents,
  adminGetReferals as apiAdminGetReferals,
  adminCreateUtmGeneratedUrl as apiAdminCreateUtmGeneratedUrl,
  adminListUtmGeneratedUrls as apiAdminListUtmGeneratedUrls,
  adminListUtmPollEvents as apiAdminListUtmPollEvents,
  adminAnalyzeUtmPollEvents as apiAdminAnalyzeUtmPollEvents,
  type AdminListResult,
  type AdminUserRow,
  type AdminVideoRow,
  type AdminCommentRow,
  type AdminReplyRow,
  type AdminFollowerRow,
  type AdminSearchRow,
} from "./api/admin"
import {
  adminListContentFlags as flagsAdminListContentFlags,
  adminGetContentFlag as flagsAdminGetContentFlag,
  adminUpdateContentFlag as flagsAdminUpdateContentFlag,
} from "./api/flags"
import {
  adminListMigrationRequests as migrationAdminList,
  adminGetMigrationRequest as migrationAdminGet,
  adminUpdateMigrationRequest as migrationAdminUpdate,
} from "./api/migration-requests"
import {
  adminListCuratedPlaylists as apiAdminListCuratedPlaylists,
  adminGetCuratedPlaylist as apiAdminGetCuratedPlaylist,
  adminCreateCuratedPlaylist as apiAdminCreateCuratedPlaylist,
  adminUpdateCuratedPlaylist as apiAdminUpdateCuratedPlaylist,
  adminDeleteCuratedPlaylist as apiAdminDeleteCuratedPlaylist,
  adminAddCuratedPlaylistItem as apiAdminAddCuratedPlaylistItem,
  adminRemoveCuratedPlaylistItem as apiAdminRemoveCuratedPlaylistItem,
  adminReorderCuratedPlaylistItems as apiAdminReorderCuratedPlaylistItems,
  type CuratedPlaylistSummary,
  type CuratedPlaylistItem,
} from "./api/admin-curated-playlists"
import {
  adminInviteAdmin as apiAdminInviteAdmin,
  adminListAdmins as apiAdminListAdmins,
  type AdminRow,
} from "./api/admin-admins"
import {
  adminListInventory as apiAdminListInventory,
  adminListInventoryClaims as apiAdminListInventoryClaims,
  adminUploadInventory as apiAdminUploadInventory,
  adminDownloadInventoryTemplate as apiAdminDownloadInventoryTemplate,
  adminExportInventory as apiAdminExportInventory,
} from "./api/admin-inventory"
import type {
  AdminListContentFlagsParams,
  ContentFlag,
  ContentFlagsListResult,
  UpdateContentFlagInput,
} from "./types/content-flag"
import {
  adminListCollaborationInquiries as collaborationAdminList,
} from "./api/collaboration"
import { getFlagsConfig as flagsGetFlagsConfig } from "./api/flags"
import type {
  AdminListCollaborationInquiriesParams,
  CollaborationInquiryListResponse,
} from "./types/collaboration-inquiry"
import type {
  AdminListMigrationRequestsParams,
  MigrationRequest,
  UpdateMigrationRequestInput,
} from "./types/youtube-migration"
import { getVideo as publicGetVideo } from "./api/public"

const ADMIN_TOKEN_KEY = "hiffi_admin_token"
const ADMIN_DATA_KEY = "hiffi_admin_data"

class AdminApiClient implements AdminApiClientContext {
  private onUnauthorized: (() => void) | null = null

  setOnUnauthorized(handler: (() => void) | null): void {
    this.onUnauthorized = handler
  }

  setAuthToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(ADMIN_TOKEN_KEY, token)
    }
  }

  getAuthToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(ADMIN_TOKEN_KEY)
    }
    return null
  }

  clearAuthToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(ADMIN_TOKEN_KEY)
    }
  }

  setAdminData(admin: AdminSession): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(ADMIN_DATA_KEY, JSON.stringify(admin))
    }
  }

  getAdminData(): AdminSession | null {
    if (typeof window === "undefined") return null
    try {
      const raw = localStorage.getItem(ADMIN_DATA_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      return isValidAdminSession(parsed) ? parsed : null
    } catch {
      return null
    }
  }

  clearSession(): void {
    this.clearAuthToken()
    if (typeof window !== "undefined") {
      localStorage.removeItem(ADMIN_DATA_KEY)
    }
  }

  setCredentials(): void {
    // Admin sessions do not store password cookies
  }

  clearCredentials(): void {
    // no-op
  }

  async proxyRequest<T>(pathname: string, searchParams?: URLSearchParams): Promise<T> {
    return this.proxyApiRequest<T>(pathname, { method: "GET", searchParams })
  }

  async proxyApiRequest<T>(
    pathname: string,
    options: { method?: string; body?: string; searchParams?: URLSearchParams } = {},
  ): Promise<T> {
    const qs = options.searchParams?.toString()
    const url = qs ? `${pathname}?${qs}` : pathname
    const method = options.method ?? "GET"
    const headers: Record<string, string> = { Accept: "application/json" }
    const token = this.getAuthToken()
    if (token) headers.Authorization = `Bearer ${token}`
    if (options.body !== undefined) headers["Content-Type"] = "application/json"

    const res = await fetch(url, {
      method,
      headers,
      body: options.body,
      cache: "no-store",
    })

    const text = await res.text()
    let parsed: unknown
    try {
      parsed = text ? JSON.parse(text) : {}
    } catch {
      if (!res.ok) throw new Error(text || `Request failed (${res.status})`)
      throw new Error("Invalid JSON response from server")
    }

    if (res.status === 401) {
      this.clearSession()
      this.onUnauthorized?.()
      throw Object.assign(new Error("Session expired"), { status: 401 }) as ApiError
    }

    if (!res.ok) {
      const p = parsed as Record<string, unknown>
      const msg =
        (typeof p.error === "string" && p.error) ||
        (typeof p.message === "string" && p.message) ||
        `Request failed (${res.status})`
      throw new Error(msg)
    }

    return parsed as T
  }

  async request<T>(endpoint: string, options: RequestInit = {}, requiresAuth = false): Promise<T> {
    const url = `${getApiBaseUrl()}${endpoint}`
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    }

    if (requiresAuth) {
      const token = this.getAuthToken()
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }
    }

    const response = await fetch(url, { ...options, headers })

    if (response.status === 401 && requiresAuth) {
      this.clearSession()
      this.onUnauthorized?.()
      throw Object.assign(new Error("Session expired"), { status: 401 }) as ApiError
    }

    const text = await response.text()
    let parsed: unknown
    try {
      parsed = text ? JSON.parse(text) : {}
    } catch {
      if (!response.ok) {
        throw Object.assign(new Error(text || `Request failed (${response.status})`), {
          status: response.status,
        }) as ApiError
      }
      throw new Error("Invalid JSON response from server")
    }

    if (!response.ok) {
      const p = parsed as Record<string, unknown>
      const msg =
        (typeof p.error === "string" && p.error) ||
        (typeof p.message === "string" && p.message) ||
        `Request failed (${response.status})`
      throw Object.assign(new Error(msg), { status: response.status, responseBody: text }) as ApiError
    }

    return parsed as T
  }

  // ─── Auth ───────────────────────────────────────────────────────────────────

  async login(username: string, password: string): Promise<AdminLoginResponse> {
    return authAdminLogin(this, { username, password })
  }

  async verifyInvite(id: string, otp: string): Promise<AdminLoginResponse> {
    return authAdminVerifyInvite(this, { id, otp })
  }

  async requestPasswordReset(email: string) {
    return adminRequestPasswordReset(this, email)
  }

  async verifyPasswordReset(data: { id: string; otp: string; new_password: string }) {
    return adminVerifyPasswordReset(this, data)
  }

  async getVideo(videoId: string) {
    return publicGetVideo(this, videoId)
  }

  async getFlagsConfig() {
    return flagsGetFlagsConfig(this)
  }

  // ─── Admin management ───────────────────────────────────────────────────────

  async adminInviteAdmin(body: {
    username: string
    email: string
    password: string
    role: AdminSession["role"]
  }) {
    return apiAdminInviteAdmin(this, body)
  }

  async adminListAdmins(params?: { limit?: number; offset?: number }) {
    return apiAdminListAdmins(this, params)
  }

  // ─── Artist inventory ───────────────────────────────────────────────────────

  async adminListInventory(params?: { limit?: number; offset?: number; search?: string }) {
    return apiAdminListInventory(this, params)
  }

  async adminUploadInventory(
    file: File,
    options?: {
      onProgress?: (progress: number) => void
      onUploadComplete?: () => void
      signal?: AbortSignal
    },
  ) {
    return apiAdminUploadInventory(this, file, options)
  }

  async adminListInventoryClaims(
    params?: Parameters<typeof apiAdminListInventoryClaims>[1],
  ) {
    return apiAdminListInventoryClaims(this, params)
  }

  async adminDownloadInventoryTemplate() {
    return apiAdminDownloadInventoryTemplate(this)
  }

  async adminExportInventory(
    params?: { created_after?: string; created_before?: string; search?: string },
  ) {
    return apiAdminExportInventory(this, params)
  }

  // ─── Curated playlists ──────────────────────────────────────────────────────

  async adminListCuratedPlaylists(params?: { limit?: number; offset?: number }) {
    return apiAdminListCuratedPlaylists(this, params)
  }

  async adminGetCuratedPlaylist(playlistId: string, params?: { limit?: number; offset?: number }) {
    return apiAdminGetCuratedPlaylist(this, playlistId, params)
  }

  async adminCreateCuratedPlaylist(body: { title: string; description?: string; video_id: string }) {
    return apiAdminCreateCuratedPlaylist(this, body)
  }

  async adminUpdateCuratedPlaylist(playlistId: string, body: { title?: string; description?: string }) {
    return apiAdminUpdateCuratedPlaylist(this, playlistId, body)
  }

  async adminDeleteCuratedPlaylist(playlistId: string) {
    return apiAdminDeleteCuratedPlaylist(this, playlistId)
  }

  async adminAddCuratedPlaylistItem(playlistId: string, videoId: string) {
    return apiAdminAddCuratedPlaylistItem(this, playlistId, videoId)
  }

  async adminRemoveCuratedPlaylistItem(playlistId: string, videoId: string) {
    return apiAdminRemoveCuratedPlaylistItem(this, playlistId, videoId)
  }

  async adminReorderCuratedPlaylistItems(playlistId: string, videoIds: string[]) {
    return apiAdminReorderCuratedPlaylistItems(this, playlistId, videoIds)
  }

  // ─── Dashboard lists ────────────────────────────────────────────────────────

  async adminListUsers(params: Record<string, string | number | undefined> = {}) {
    const res: AdminListResult<AdminUserRow> = await apiAdminListUsers(this, params)
    return { status: res.status, users: res.items, limit: res.limit, offset: res.offset, count: res.count, filters: res.filters }
  }

  async adminListVideos(params: Record<string, string | number | undefined> = {}) {
    const res: AdminListResult<AdminVideoRow> = await apiAdminListVideos(this, params)
    return { status: res.status, videos: res.items, limit: res.limit, offset: res.offset, count: res.count, filters: res.filters }
  }

  async adminListComments(params: { limit?: number; offset?: number; filter?: string } = {}) {
    return apiAdminListComments(this, params)
  }

  async adminListReplies(params: { limit?: number; offset?: number; filter?: string } = {}) {
    return apiAdminListReplies(this, params)
  }

  async adminCounters(noCache = false) {
    return apiAdminCounters(this, noCache)
  }

  async adminResyncCounters() {
    return apiAdminResyncCounters(this)
  }

  async adminListFollowers(params: Record<string, string | number | undefined> = {}) {
    const res: AdminListResult<AdminFollowerRow> = await apiAdminListFollowers(this, params)
    return { status: res.status, followers: res.items, limit: res.limit, offset: res.offset, count: res.count, filters: res.filters }
  }

  async adminListSearches(params: Record<string, string | number | undefined> = {}) {
    const res = await apiAdminListSearches(this, params)
    return {
      status: res.status,
      searches: res.items as AdminSearchRow[],
      limit: res.limit,
      offset: res.offset,
      count: res.count,
      has_more: res.has_more,
      filters: res.filters,
    }
  }

  async adminDisableUser(username: string): Promise<{
    success: boolean
    data?: { message?: string }
    message?: string
  }> {
    return apiAdminDisableUser(this, username) as Promise<{
      success: boolean
      data?: { message?: string }
      message?: string
    }>
  }

  async adminEnableUser(username: string): Promise<{
    success: boolean
    data?: { message?: string }
    message?: string
  }> {
    return apiAdminEnableUser(this, username) as Promise<{
      success: boolean
      data?: { message?: string }
      message?: string
    }>
  }

  async adminGetAnalyticsEvents(params: Parameters<typeof apiAdminGetAnalyticsEvents>[1] = {}) {
    return apiAdminGetAnalyticsEvents(this, params)
  }

  async adminGetReferals(params: Parameters<typeof apiAdminGetReferals>[1] = {}) {
    return apiAdminGetReferals(this, params)
  }

  async adminCreateUtmGeneratedUrl(body: { url: string; utm_source: string; label?: string }) {
    return apiAdminCreateUtmGeneratedUrl(this, body)
  }

  async adminListUtmGeneratedUrls(params?: { limit?: number; offset?: number }) {
    return apiAdminListUtmGeneratedUrls(this, params)
  }

  async adminListUtmPollEvents(params?: Record<string, string | number | undefined>) {
    return apiAdminListUtmPollEvents(this, params)
  }

  async adminAnalyzeUtmPollEvents(params?: Record<string, string | number | undefined>) {
    return apiAdminAnalyzeUtmPollEvents(this, params)
  }

  async adminListContentFlags(params?: AdminListContentFlagsParams): Promise<ContentFlagsListResult> {
    return flagsAdminListContentFlags(this, params)
  }

  async adminGetContentFlag(flagId: string): Promise<ContentFlag> {
    return flagsAdminGetContentFlag(this, flagId)
  }

  async adminUpdateContentFlag(flagId: string, body: UpdateContentFlagInput): Promise<ContentFlag> {
    return flagsAdminUpdateContentFlag(this, flagId, body)
  }

  async adminListCollaborationInquiries(
    params?: AdminListCollaborationInquiriesParams,
  ): Promise<CollaborationInquiryListResponse> {
    return collaborationAdminList(this, params)
  }

  async adminListMigrationRequests(params?: AdminListMigrationRequestsParams) {
    return migrationAdminList(this, params)
  }

  async adminGetMigrationRequest(id: string): Promise<MigrationRequest> {
    return migrationAdminGet(this, id)
  }

  async adminUpdateMigrationRequest(id: string, body: UpdateMigrationRequestInput): Promise<MigrationRequest> {
    return migrationAdminUpdate(this, id, body)
  }

  async deleteUserByUsername(username: string): Promise<{ status: string; message: string }> {
    if (!username?.trim()) throw new Error("Username is required")
    const response = await this.request<{
      success?: boolean
      status?: string
      message?: string
      data?: { message?: string }
    }>(`/admin/users/${encodeURIComponent(username)}`, { method: "DELETE" }, true)
    if (response.success && response.data) {
      return { status: "success", message: response.data.message || response.message || "User deleted successfully" }
    }
    if (response.status === "success" || response.success) {
      return { status: response.status || "success", message: response.message || "User deleted successfully" }
    }
    throw new Error(response.message || "Failed to delete user")
  }

  async deleteVideoByVideoId(videoId: string): Promise<{ status: string; message: string }> {
    if (!videoId?.trim()) throw new Error("Video ID is required")
    const response = await this.request<{
      success?: boolean
      status?: string
      message?: string
      data?: { message?: string }
    }>(`/admin/videos/${encodeURIComponent(videoId)}`, { method: "DELETE" }, true)
    if (response.success && response.data) {
      return { status: "success", message: response.data.message || response.message || "Video deleted successfully" }
    }
    if (response.status === "success" || response.success) {
      return { status: response.status || "success", message: response.message || "Video deleted successfully" }
    }
    return { status: "error", message: response.message || "Failed to delete video" }
  }

  async deleteCommentByCommentId(commentId: string): Promise<{ status: string; message: string }> {
    if (!commentId?.trim()) throw new Error("Comment ID is required")
    const response = await this.request<{
      success?: boolean
      status?: string
      message?: string
      data?: { message?: string }
    }>(`/admin/comments/${encodeURIComponent(commentId)}`, { method: "DELETE" }, true)
    if (response.success && response.data) {
      return { status: "success", message: response.data.message || response.message || "Comment deleted successfully" }
    }
    if (response.status === "success" || response.success) {
      return { status: response.status || "success", message: response.message || "Comment deleted successfully" }
    }
    return { status: "error", message: response.message || "Failed to delete comment" }
  }

  async deleteReplyByReplyId(replyId: string): Promise<{ status: string; message: string }> {
    if (!replyId?.trim()) throw new Error("Reply ID is required")
    const response = await this.request<{
      success?: boolean
      status?: string
      message?: string
      data?: { message?: string }
    }>(`/admin/replies/${encodeURIComponent(replyId)}`, { method: "DELETE" }, true)
    if (response.success && response.data) {
      return { status: "success", message: response.data.message || response.message || "Reply deleted successfully" }
    }
    if (response.status === "success" || response.success) {
      return { status: response.status || "success", message: response.message || "Reply deleted successfully" }
    }
    return { status: "error", message: response.message || "Failed to delete reply" }
  }
}

export const adminApiClient = new AdminApiClient()

export type { CuratedPlaylistSummary, CuratedPlaylistItem, AdminRow, AdminCommentRow, AdminReplyRow, AdminUserRow, AdminVideoRow }
