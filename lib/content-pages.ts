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

export const CONTENT_PAGE_PATHS = CONTENT_PAGE_LINKS.map((link) => link.href)

export function isContentPage(pathname: string | null): boolean {
  if (!pathname) return false
  return CONTENT_PAGE_PATHS.includes(pathname)
}
