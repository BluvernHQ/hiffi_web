export const BRAND_COLLAB_TYPES = [
  { id: "sponsored_drops", label: "Sponsored drops" },
  { id: "artist_collabs", label: "Artist collabs" },
  { id: "exclusive_content", label: "Exclusive content" },
  { id: "hiffi_sessions", label: "Hiffi Sessions" },
  { id: "playlist_takeover", label: "Playlist takeover" },
  { id: "live_events", label: "Live events" },
  { id: "merch_drops", label: "Merch drops" },
  { id: "other", label: "Other" },
] as const

export type BrandCollabTypeId = (typeof BRAND_COLLAB_TYPES)[number]["id"]

export const BRAND_COLLAB_BUDGET_RANGES = [
  { id: "under_5k", label: "Under $5k" },
  { id: "5k_15k", label: "$5k–$15k" },
  { id: "15k_50k", label: "$15k–$50k" },
  { id: "50k_plus", label: "$50k+" },
  { id: "lets_talk", label: "Let's talk" },
] as const

export type BrandCollabBudgetRangeId = (typeof BRAND_COLLAB_BUDGET_RANGES)[number]["id"]

export const BRAND_COLLAB_TIMELINES = [
  { id: "within_1_month", label: "Within 1 month" },
  { id: "1_3_months", label: "1–3 months" },
  { id: "3_6_months", label: "3–6 months" },
  { id: "exploring", label: "Just exploring" },
] as const

export type BrandCollabTimelineId = (typeof BRAND_COLLAB_TIMELINES)[number]["id"]

export const BRAND_COLLAB_HEARD_ABOUT = [
  { id: "social_media", label: "Social media" },
  { id: "referral", label: "Referral" },
  { id: "artist", label: "Artist / creator" },
  { id: "event", label: "Event" },
  { id: "search", label: "Search" },
  { id: "press", label: "Press / media" },
  { id: "other", label: "Other" },
] as const

export type BrandCollabHeardAboutId = (typeof BRAND_COLLAB_HEARD_ABOUT)[number]["id"]

export type BrandCollaborationSubmission = {
  brandName: string
  website?: string
  contactName: string
  contactEmail: string
  brandDescription?: string
  collabTypes: BrandCollabTypeId[]
  budgetRange?: BrandCollabBudgetRangeId
  timeline?: BrandCollabTimelineId
  heardAbout?: string
  collaborationGoal?: string
  anythingElse?: string
  referredArtist?: string
}
