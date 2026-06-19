import { NextResponse } from "next/server"
import { z } from "zod"
import { sendBrandCollaborationEmails } from "@/lib/brand-collaboration-email"
import {
  BRAND_COLLAB_BUDGET_RANGES,
  BRAND_COLLAB_TIMELINES,
  BRAND_COLLAB_TYPES,
  type BrandCollaborationSubmission,
} from "@/lib/types/brand-collaboration"

const collabTypeIds = BRAND_COLLAB_TYPES.map((t) => t.id) as [string, ...string[]]
const budgetIds = BRAND_COLLAB_BUDGET_RANGES.map((b) => b.id) as [string, ...string[]]
const timelineIds = BRAND_COLLAB_TIMELINES.map((t) => t.id) as [string, ...string[]]

const submissionSchema = z.object({
  brandName: z.string().trim().min(1, "Brand name is required."),
  website: z.string().trim().optional(),
  contactName: z.string().trim().min(1, "Contact name is required."),
  contactEmail: z.string().trim().email("Enter a valid contact email."),
  brandDescription: z.string().trim().optional(),
  collabTypes: z.array(z.enum(collabTypeIds)).default([]),
  budgetRange: z.enum(budgetIds).optional(),
  timeline: z.enum(timelineIds).optional(),
  heardAbout: z.string().trim().optional(),
  collaborationGoal: z.string().trim().optional(),
  anythingElse: z.string().trim().optional(),
  referredArtist: z.string().trim().optional(),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const parsed = submissionSchema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.errors[0]?.message ?? "Invalid submission."
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const submission = parsed.data as BrandCollaborationSubmission

  try {
    await sendBrandCollaborationEmails(submission)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send collaboration request."
    console.error("[collab] email failed:", message)
    return NextResponse.json(
      { error: "We could not send your request right now. Please try again or email ads@hiffi.com." },
      { status: 503 },
    )
  }

  return NextResponse.json({ success: true })
}
