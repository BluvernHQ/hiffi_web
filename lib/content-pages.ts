export type ContentPageLink = {
  href: string
  label: string
}

/** Static informational routes: minimal chrome (logo-only navbar, no sidebar). */
export const CONTENT_PAGE_LINKS: ContentPageLink[] = [
  { href: "/terms-of-use", label: "Terms of Use" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/payment-terms", label: "Payment Terms" },
  { href: "/copyright", label: "Copyright" },
  { href: "/community-guidelines", label: "Community Guidelines" },
  { href: "/faq", label: "FAQ" },
  { href: "/support", label: "Support" },
]

/** Compact discover links for the app sidebar footer (YouTube-style, not the full site footer). */
export const SIDEBAR_FOOTER_DISCOVER_LINKS: ContentPageLink[] = [
  { href: "/hip-hop", label: "Hip-Hop" },
  { href: "/atlanta", label: "Atlanta guide" },
  { href: "/artist-index", label: "Artist Index" },
  { href: "/hiffi-500", label: "Hiffi 500" },
  { href: "/artist-index/claim", label: "Claim your profile" },
]

/** Legal + help links shown at the bottom of the left sidebar. */
export const SIDEBAR_FOOTER_LINKS: ContentPageLink[] = [
  { href: "/terms-of-use", label: "Terms of Use" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/payment-terms", label: "Payment Terms" },
  { href: "/copyright", label: "Copyright" },
  { href: "/community-guidelines", label: "Community Guidelines" },
  { href: "/faq", label: "FAQ" },
  { href: "/support", label: "Support" },
  { href: "/app", label: "Download Hiffi App" },
]

/** Marketing / informational pages with the same minimal chrome. */
export const MARKETING_PAGE_PATHS = [
  "/about",
  "/app",
  "/what-is-hiffi",
  "/how-it-works",
  "/advertising",
  "/artists",
  "/creator-playbook",
  "/creators-for-change",
  "/press",
  "/community-guidelines",
] as const

/** Lead / marketing forms that use the same minimal chrome as content pages. */
export const MINIMAL_CHROME_PATHS = ["/collaborate"] as const

export const CONTENT_PAGE_PATHS = [
  ...CONTENT_PAGE_LINKS.map((link) => link.href),
  ...MARKETING_PAGE_PATHS,
  ...MINIMAL_CHROME_PATHS,
]

export function isContentPage(pathname: string | null): boolean {
  if (!pathname) return false
  if (CONTENT_PAGE_PATHS.includes(pathname)) return true
  if (pathname === "/artist-index" || pathname.startsWith("/artist-index/")) return true
  if (pathname === "/atlanta" || pathname.startsWith("/atlanta/")) return true
  if (pathname === "/hiffi-500" || pathname.startsWith("/hiffi-500/")) return true
  return false
}

/** Static marketing + legal routes for sitemap.xml */
export const SITEMAP_STATIC_CONTENT_PAGES: Array<{
  path: string
  changeFrequency: "weekly" | "monthly" | "yearly"
  priority: number
}> = [
  { path: "/about", changeFrequency: "monthly", priority: 0.88 },
  { path: "/what-is-hiffi", changeFrequency: "monthly", priority: 0.82 },
  { path: "/how-it-works", changeFrequency: "monthly", priority: 0.8 },
  { path: "/artists", changeFrequency: "monthly", priority: 0.85 },
  { path: "/creator-playbook", changeFrequency: "monthly", priority: 0.78 },
  { path: "/press", changeFrequency: "monthly", priority: 0.65 },
  { path: "/advertising", changeFrequency: "monthly", priority: 0.72 },
  { path: "/creators-for-change", changeFrequency: "monthly", priority: 0.72 },
  { path: "/collaborate", changeFrequency: "monthly", priority: 0.7 },
  { path: "/community-guidelines", changeFrequency: "yearly", priority: 0.55 },
  { path: "/copyright", changeFrequency: "yearly", priority: 0.5 },
  { path: "/hiffi-500", changeFrequency: "weekly", priority: 0.94 },
  { path: "/hiffi-500/methodology", changeFrequency: "monthly", priority: 0.8 },
  { path: "/hiffi-500/city/atlanta", changeFrequency: "weekly", priority: 0.9 },
  { path: "/hiffi-500/city/houston", changeFrequency: "monthly", priority: 0.7 },
  { path: "/hiffi-500/city/detroit", changeFrequency: "monthly", priority: 0.7 },
  { path: "/hiffi-500/city/chicago", changeFrequency: "monthly", priority: 0.7 },
  { path: "/hiffi-500/biggest-risers", changeFrequency: "weekly", priority: 0.86 },
  { path: "/hiffi-500/biggest-fallers", changeFrequency: "weekly", priority: 0.84 },
  { path: "/hiffi-500/new-entries", changeFrequency: "weekly", priority: 0.84 },
  { path: "/hiffi-500/breakout-100", changeFrequency: "weekly", priority: 0.88 },
]
