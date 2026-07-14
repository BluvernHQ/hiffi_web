import { getApiBaseUrl } from "@/lib/config"
import type { AdminApiClientContext } from "./context"
import { assertSuccess, extractApiError } from "./envelope"
import type {
  AdminListCollaborationInquiriesParams,
  CollaborationInquiry,
  CollaborationInquiryForm,
  CollaborationInquiryListResponse,
  CollaborationSubmitResponse,
} from "@/lib/types/collaboration-inquiry"
import { COLLABORATION_FIELD_LIMITS } from "@/lib/types/collaboration-inquiry"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidCollaborationWebsite(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return true
  if (!trimmed.startsWith("https://")) return false
  try {
    const url = new URL(trimmed)
    return Boolean(url.hostname)
  } catch {
    return false
  }
}

export type CollaborationFormFieldErrors = Partial<
  Record<
    | "brand_name"
    | "website"
    | "contact_name"
    | "contact_email"
    | "brand_description"
    | "collaboration_goal"
    | "anything_else"
    | "form",
    string
  >
>

export function validateCollaborationInquiryForm(
  form: CollaborationInquiryForm,
): CollaborationFormFieldErrors {
  const errors: CollaborationFormFieldErrors = {}

  const brandName = form.brand_name.trim()
  if (!brandName) errors.brand_name = "Brand name is required."
  else if (brandName.length > COLLABORATION_FIELD_LIMITS.brand_name) {
    errors.brand_name = `Brand name must be at most ${COLLABORATION_FIELD_LIMITS.brand_name} characters.`
  }

  const contactName = form.contact_name.trim()
  if (!contactName) errors.contact_name = "Contact name is required."
  else if (contactName.length > COLLABORATION_FIELD_LIMITS.contact_name) {
    errors.contact_name = `Contact name must be at most ${COLLABORATION_FIELD_LIMITS.contact_name} characters.`
  }

  const contactEmail = form.contact_email.trim()
  if (!contactEmail) errors.contact_email = "Contact email is required."
  else if (contactEmail.length > COLLABORATION_FIELD_LIMITS.contact_email) {
    errors.contact_email = `Email must be at most ${COLLABORATION_FIELD_LIMITS.contact_email} characters.`
  } else if (!EMAIL_RE.test(contactEmail)) {
    errors.contact_email = "Enter a valid email address."
  }

  const brandDescription = form.brand_description.trim()
  if (!brandDescription) errors.brand_description = "Brand description is required."
  else if (brandDescription.length > COLLABORATION_FIELD_LIMITS.brand_description) {
    errors.brand_description = `Brand description must be at most ${COLLABORATION_FIELD_LIMITS.brand_description} characters.`
  }

  const collaborationGoal = form.collaboration_goal.trim()
  if (!collaborationGoal) errors.collaboration_goal = "Collaboration goal is required."
  else if (collaborationGoal.length > COLLABORATION_FIELD_LIMITS.collaboration_goal) {
    errors.collaboration_goal = `Collaboration goal must be at most ${COLLABORATION_FIELD_LIMITS.collaboration_goal} characters.`
  }

  const website = form.website?.trim() ?? ""
  if (website) {
    if (website.length > COLLABORATION_FIELD_LIMITS.website) {
      errors.website = `Website must be at most ${COLLABORATION_FIELD_LIMITS.website} characters.`
    } else if (!isValidCollaborationWebsite(website)) {
      errors.website = "Website must be a valid https URL (e.g. https://acme.com)."
    }
  }

  const anythingElse = form.anything_else?.trim() ?? ""
  if (anythingElse.length > COLLABORATION_FIELD_LIMITS.anything_else) {
    errors.anything_else = `Notes must be at most ${COLLABORATION_FIELD_LIMITS.anything_else} characters.`
  }

  return errors
}

function normalizeInquiry(raw: Record<string, unknown>): CollaborationInquiry {
  const str = (key: string) => {
    const v = raw[key]
    return typeof v === "string" ? v : undefined
  }
  return {
    id: String(raw.id ?? ""),
    brand_name: String(raw.brand_name ?? ""),
    website: str("website"),
    contact_name: String(raw.contact_name ?? ""),
    contact_email: String(raw.contact_email ?? ""),
    brand_description: String(raw.brand_description ?? ""),
    collaboration_goal: String(raw.collaboration_goal ?? ""),
    anything_else: str("anything_else"),
    client_ip: str("client_ip"),
    email_sent: Boolean(raw.email_sent),
    email_sent_at: str("email_sent_at"),
    created_at: String(raw.created_at ?? ""),
  }
}

export async function submitCollaborationInquiry(
  form: CollaborationInquiryForm,
): Promise<CollaborationSubmitResponse> {
  const payload: CollaborationInquiryForm = {
    brand_name: form.brand_name.trim(),
    contact_name: form.contact_name.trim(),
    contact_email: form.contact_email.trim(),
    brand_description: form.brand_description.trim(),
    collaboration_goal: form.collaboration_goal.trim(),
  }
  const website = form.website?.trim()
  if (website) payload.website = website
  const anythingElse = form.anything_else?.trim()
  if (anythingElse) payload.anything_else = anythingElse

  const res = await fetch(`${getApiBaseUrl()}/collaboration/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  const body = (await res.json().catch(() => ({}))) as unknown
  if (!res.ok) {
    const message = extractApiError(body) ?? `Request failed (${res.status})`
    throw new Error(message)
  }

  return assertSuccess<CollaborationSubmitResponse>(body)
}

export async function adminListCollaborationInquiries(
  ctx: AdminApiClientContext,
  params: AdminListCollaborationInquiriesParams = {},
): Promise<CollaborationInquiryListResponse> {
  const qs = new URLSearchParams()
  if (params.limit != null) qs.set("limit", String(params.limit))
  if (params.offset != null) qs.set("offset", String(params.offset))
  if (params.contact_email) qs.set("contact_email", params.contact_email)
  if (params.email_sent != null) qs.set("email_sent", String(params.email_sent))

  const endpoint = `/admin/collaboration-inquiries${qs.toString() ? `?${qs.toString()}` : ""}`
  const raw = await ctx.request<unknown>(endpoint, undefined, true)
  const data = assertSuccess<Record<string, unknown>>(raw)

  const rawList = data.inquiries
  const inquiries = (Array.isArray(rawList) ? rawList : []).map((row) =>
    normalizeInquiry(row as Record<string, unknown>),
  )

  return {
    inquiries,
    limit: typeof data.limit === "number" ? data.limit : params.limit ?? 20,
    offset: typeof data.offset === "number" ? data.offset : params.offset ?? 0,
    count: typeof data.count === "number" ? data.count : inquiries.length,
  }
}
