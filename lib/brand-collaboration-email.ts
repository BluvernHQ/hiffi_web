import {
  BRAND_COLLAB_BUDGET_RANGES,
  BRAND_COLLAB_TIMELINES,
  BRAND_COLLAB_TYPES,
  type BrandCollaborationSubmission,
} from "@/lib/types/brand-collaboration"

const TEAM_EMAIL = process.env.COLLAB_TEAM_EMAIL ?? "ads@hiffi.com"
const FROM_EMAIL = process.env.COLLAB_FROM_EMAIL ?? "Hiffi <noreply@hiffi.com>"

function labelFor<T extends { id: string; label: string }>(options: readonly T[], id?: string): string {
  if (!id) return "—"
  return options.find((o) => o.id === id)?.label ?? id
}

function collabTypeLabels(ids: string[]): string {
  if (ids.length === 0) return "—"
  return ids
    .map((id) => BRAND_COLLAB_TYPES.find((t) => t.id === id)?.label ?? id)
    .join(", ")
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function fieldRow(label: string, value: string): string {
  return `<tr><td style="padding:8px 12px 8px 0;color:#666;vertical-align:top;white-space:nowrap">${escapeHtml(label)}</td><td style="padding:8px 0">${escapeHtml(value)}</td></tr>`
}

function buildTeamSummaryHtml(submission: BrandCollaborationSubmission): string {
  const rows = [
    fieldRow("Brand", submission.brandName),
    fieldRow("Website", submission.website?.trim() || "—"),
    fieldRow("Contact", submission.contactName),
    fieldRow("Email", submission.contactEmail),
    fieldRow("Description", submission.brandDescription?.trim() || "—"),
    fieldRow("Collab types", collabTypeLabels(submission.collabTypes)),
    fieldRow("Budget", labelFor(BRAND_COLLAB_BUDGET_RANGES, submission.budgetRange)),
    fieldRow("Timeline", labelFor(BRAND_COLLAB_TIMELINES, submission.timeline)),
    fieldRow("Heard about Hiffi", submission.heardAbout?.trim() || "—"),
    fieldRow("Collaboration goal", submission.collaborationGoal?.trim() || "—"),
    fieldRow("Anything else", submission.anythingElse?.trim() || "—"),
    fieldRow("Referred artist", submission.referredArtist?.trim() || "—"),
  ].join("")

  return `
    <div style="font-family:system-ui,sans-serif;color:#111;max-width:640px">
      <h2 style="margin:0 0 16px;font-size:18px">New brand collaboration request</h2>
      <table style="border-collapse:collapse;font-size:14px;line-height:1.5">${rows}</table>
    </div>
  `.trim()
}

function buildConfirmationHtml(brandName: string): string {
  return `
    <div style="font-family:system-ui,sans-serif;color:#111;max-width:640px">
      <h2 style="margin:0 0 12px;font-size:18px">We received your collaboration request</h2>
      <p style="margin:0 0 12px;font-size:14px;line-height:1.6">
        Thanks for reaching out from <strong>${escapeHtml(brandName)}</strong>. The Hiffi partnerships team will review your request and reply within <strong>3–5 business days</strong>.
      </p>
      <p style="margin:0;font-size:14px;line-height:1.6;color:#555">
        — The Hiffi team
      </p>
    </div>
  `.trim()
}

async function sendResendEmail(input: {
  to: string | string[]
  subject: string
  html: string
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured")
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: Array.isArray(input.to) ? input.to : [input.to],
      subject: input.subject,
      html: input.html,
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => "")
    throw new Error(body || `Email send failed (${response.status})`)
  }
}

export async function sendBrandCollaborationEmails(
  submission: BrandCollaborationSubmission,
): Promise<void> {
  await sendResendEmail({
    to: TEAM_EMAIL,
    subject: `Brand collab request: ${submission.brandName}`,
    html: buildTeamSummaryHtml(submission),
  })

  await sendResendEmail({
    to: submission.contactEmail,
    subject: "We received your Hiffi collaboration request",
    html: buildConfirmationHtml(submission.brandName),
  })
}
