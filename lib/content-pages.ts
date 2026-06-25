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
  { href: "/faq", label: "FAQ" },
  { href: "/support", label: "Support" },
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
  { path: "/copyright", changeFrequency: "yearly", priority: 0.5 },
]
