import type { ApiClientContext } from "./context"
import { assertSuccess } from "./envelope"
import type {
  AdminListFeedbackParams,
  FeedbackListResult,
  FeedbackPlatform,
  FeedbackSubmission,
  ScreenshotUploadTarget,
  SubmitFeedbackInput,
  SubmitFeedbackResult,
} from "@/lib/types/feedback"

/**
 * POST /feedback/screenshot/upload — request a presigned R2 upload URL.
 * Auth is optional; the proxy forwards the bearer token when present.
 */
export async function requestFeedbackScreenshotUpload(
  ctx: ApiClientContext,
): Promise<ScreenshotUploadTarget> {
  const res = await ctx.proxyApiRequest<{
    success?: boolean
    data?: ScreenshotUploadTarget
    error?: string
  }>("/proxy/feedback/screenshot/upload", { method: "POST", body: "{}" })
  return assertSuccess<ScreenshotUploadTarget>(res)
}

/**
 * Upload the raw screenshot bytes to the presigned R2 URL.
 *
 * A direct browser PUT to R2 is blocked by CORS (the presigned host doesn't
 * answer the preflight), so we route through the same-origin proxy, which
 * forwards the bytes server-side. The blob must be JPEG.
 */
export async function uploadFeedbackScreenshot(
  gatewayUrl: string,
  blob: Blob,
): Promise<void> {
  const res = await fetch(`/proxy/feedback/screenshot/put?url=${encodeURIComponent(gatewayUrl)}`, {
    method: "PUT",
    headers: { "Content-Type": "image/jpeg" },
    body: blob,
  })
  if (!res.ok) {
    let message = `Failed to upload screenshot (${res.status})`
    try {
      const data = (await res.json()) as { error?: string }
      if (data && typeof data.error === "string") message = data.error
    } catch {
      // Non-JSON error body — keep the status-based message.
    }
    throw new Error(message)
  }
}

/**
 * POST /feedback/ — submit the feedback record.
 * Auth is optional; the proxy forwards the bearer token when present.
 */
export async function submitFeedback(
  ctx: ApiClientContext,
  body: SubmitFeedbackInput,
): Promise<SubmitFeedbackResult> {
  const res = await ctx.proxyApiRequest<{
    success?: boolean
    data?: SubmitFeedbackResult
    error?: string
  }>("/proxy/feedback", { method: "POST", body: JSON.stringify(body) })
  return assertSuccess<SubmitFeedbackResult>(res)
}

/* -------------------------------------------------------------------------- */
/* Admin dashboard (read-only)                                                */
/* -------------------------------------------------------------------------- */

const MAX_FEEDBACK_PAGE = 100

function clampFeedbackLimit(limit?: number, fallback = 20): number {
  const n = limit ?? fallback
  return Math.min(Math.max(1, n), MAX_FEEDBACK_PAGE)
}

/** Normalize an admin feedback submission row (defensive against nulls). */
export function normalizeFeedbackSubmission(raw: unknown): FeedbackSubmission {
  if (raw === null || typeof raw !== "object") {
    throw new Error("Invalid feedback response from server")
  }
  const r = raw as Record<string, unknown>
  const nullableString = (value: unknown): string | undefined =>
    value === null || value === undefined ? undefined : String(value)

  return {
    id: String(r.id ?? ""),
    user_id: nullableString(r.user_id),
    email: nullableString(r.email),
    description: String(r.description ?? ""),
    screenshot_url: nullableString(r.screenshot_url),
    allow_contact: r.allow_contact === true,
    page_url: String(r.page_url ?? ""),
    user_agent: String(r.user_agent ?? ""),
    app_version: String(r.app_version ?? ""),
    platform: String(r.platform ?? "web").toLowerCase().trim() as FeedbackPlatform,
    client_ip: nullableString(r.client_ip),
    email_sent: r.email_sent === true,
    email_sent_at: nullableString(r.email_sent_at),
    created_at: String(r.created_at ?? ""),
  }
}

/** GET /admin/feedback — list submissions, newest first. */
export async function adminListFeedback(
  ctx: ApiClientContext,
  params: AdminListFeedbackParams = {},
): Promise<FeedbackListResult> {
  const query = new URLSearchParams()
  query.set("limit", String(clampFeedbackLimit(params.limit)))
  if (params.offset !== undefined) query.set("offset", String(params.offset))
  if (params.platform) query.set("platform", params.platform)
  if (params.allow_contact !== undefined) query.set("allow_contact", String(params.allow_contact))
  if (params.user_id) query.set("user_id", params.user_id)
  if (params.email_sent !== undefined) query.set("email_sent", String(params.email_sent))

  const res = await ctx.proxyApiRequest<{
    success?: boolean
    data?: FeedbackListResult
    error?: string
  }>("/proxy/admin-feedback", { method: "GET", searchParams: query })
  const data = assertSuccess<{
    submissions?: unknown[]
    limit?: number
    offset?: number
    count?: number
  }>(res)
  const rows = data.submissions ?? []
  return {
    submissions: rows.map((row) => normalizeFeedbackSubmission(row)),
    limit: data.limit ?? params.limit ?? 20,
    offset: data.offset ?? params.offset ?? 0,
    count: data.count ?? rows.length,
  }
}

/** GET /admin/feedback/{feedbackID} — fetch one submission. */
export async function adminGetFeedback(
  ctx: ApiClientContext,
  feedbackId: string,
): Promise<FeedbackSubmission> {
  const encoded = encodeURIComponent(feedbackId)
  const res = await ctx.proxyApiRequest<{
    success?: boolean
    data?: { submission?: unknown }
    error?: string
  }>(`/proxy/admin-feedback/${encoded}`, { method: "GET" })
  const data = assertSuccess<{ submission?: unknown }>(res)
  return normalizeFeedbackSubmission(data.submission)
}
