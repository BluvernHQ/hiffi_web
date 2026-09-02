import { absoluteUrl } from "@/lib/seo/site"

export const FEATURE_REQUEST_PATH = "/feature-request"
export const DISCOVERY_SURVEY_PATH = "/hiffi-discovery-form"
export const BOOK_WALKTHROUGH_PATH = "/book-walkthrough"

/** Default Calendly event for creator onboarding walkthroughs. */
export const DEFAULT_CREATOR_WALKTHROUGH_CALENDLY_URL =
  "https://calendly.com/hiffiapps/30min"

/** Calendly URL for creator walkthroughs (env overrides default). */
export function getCreatorWalkthroughCalendlyUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_CALENDLY_WALKTHROUGH_URL?.trim()
  return fromEnv || DEFAULT_CREATOR_WALKTHROUGH_CALENDLY_URL
}

export function getFeatureRequestUrl(): string {
  return absoluteUrl(FEATURE_REQUEST_PATH)
}

export function getDiscoverySurveyUrl(): string {
  return absoluteUrl(DISCOVERY_SURVEY_PATH)
}

export function getBookWalkthroughUrl(): string {
  return absoluteUrl(BOOK_WALKTHROUGH_PATH)
}
