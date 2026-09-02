import { readFile } from "fs/promises"
import path from "path"

import { getCreatorWalkthroughCalendlyUrl } from "@/lib/creator-onboarding-links"
import { absoluteUrlForOrigin } from "@/lib/seo/site"

export const WELCOME_MAIL_TEMPLATE_PATH = path.join(
  process.cwd(),
  "content/mail-templates/welcome.html",
)

/** Relative paths used in welcome.html (preview uses these as-is). */
const WELCOME_MAIL_RELATIVE_PATHS = [
  "/",
  "/appbarlogo.png",
  "/studio/tools/migrate",
  "/feature-request",
  "/hiffi-discovery-form",
  "/studio",
  "/support",
  "/privacy-policy",
  "/terms-of-use",
] as const

/** Merge tags left for the ESP (Customer.io, etc.). */
export type WelcomeMailMergeTags = {
  firstName?: string
}

/** Document merge tags for ESP copy/paste. */
export const WELCOME_MAIL_PATH_TAGS = {
  HOME_URL: "/",
  LOGO_URL: "/appbarlogo.png",
  MIGRATE_URL: "/studio/tools/migrate",
  FEATURE_REQUEST_URL: "/feature-request",
  DISCOVERY_SURVEY_URL: "/hiffi-discovery-form",
  CALENDLY_WALKTHROUGH_URL: getCreatorWalkthroughCalendlyUrl(),
  STUDIO_URL: "/studio",
  SUPPORT_URL: "/support",
  PRIVACY_URL: "/privacy-policy",
  TERMS_URL: "/terms-of-use",
} as const

function expandRelativeUrls(html: string, origin: string): string {
  let output = html
  for (const routePath of WELCOME_MAIL_RELATIVE_PATHS) {
    const absolute = absoluteUrlForOrigin(origin, routePath)
    output = output.replaceAll(`href="${routePath}"`, `href="${absolute}"`)
    output = output.replaceAll(`src="${routePath}"`, `src="${absolute}"`)
  }
  return output
}

export async function loadWelcomeMailTemplate(
  merge: WelcomeMailMergeTags = {},
  options?: { origin?: string; absolute?: boolean },
): Promise<string> {
  const html = await readFile(WELCOME_MAIL_TEMPLATE_PATH, "utf8")

  let output = html.replaceAll("{{First_Name}}", merge.firstName?.trim() || "Creator")

  output = output.replaceAll(
    "{{CALENDLY_WALKTHROUGH_URL}}",
    getCreatorWalkthroughCalendlyUrl(),
  )

  output = output.replaceAll("{{DISCOVERY_SURVEY_URL}}", "/hiffi-discovery-form")

  if (options?.absolute && options.origin) {
    output = expandRelativeUrls(output, options.origin)
  }

  return output
}
