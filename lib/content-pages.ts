export type ContentPageLink = {
  href: string
  label: string
}

/** Static informational routes: minimal chrome (logo-only navbar, no sidebar). */
export const CONTENT_PAGE_LINKS: ContentPageLink[] = [
  { href: "/terms-of-use", label: "Terms of Use" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/payment-terms", label: "Payment Terms" },
  { href: "/faq", label: "FAQ" },
  { href: "/support", label: "Support" },
]

/** Lead / marketing forms that use the same minimal chrome as content pages. */
export const MINIMAL_CHROME_PATHS = ["/collaborate"] as const

export const CONTENT_PAGE_PATHS = [
  ...CONTENT_PAGE_LINKS.map((link) => link.href),
  ...MINIMAL_CHROME_PATHS,
]

export function isContentPage(pathname: string | null): boolean {
  if (!pathname) return false
  return CONTENT_PAGE_PATHS.includes(pathname)
}
