export const DISALLOW_PATHS = [
  "/admin/",
  "/api/",
  // Prefix match: blocks /studio and /studio/* (exact /studio has no trailing slash)
  "/studio",
  "/login",
  "/signup",
  "/forgot-password",
  "/history",
  "/following",
  "/liked",
  "/playlists",
  "/maintenance",
  "/test-hls",
  "/support/reports/",
  // Intentional product path (referral links), not a spelling mistake — see app/referrar/
  "/referrar/",
] as const

export function formatDisallowLines(paths: readonly string[]): string {
  return paths.map((path) => `Disallow: ${path}`).join("\n")
}

/**
 * Non-prod (dev/beta): block all crawlers including AI bots.
 * Avoid staging/dev content being cited by ChatGPT / Perplexity / Claude.
 * GEO testing should use production (or a dedicated allowlisted preview host).
 */
export function buildNonProdRobotsBody(): string {
  return [
    "User-agent: *",
    "Disallow: /",
    "",
    "# Non-prod: search engines and AI bots blocked to prevent staging citation pollution.",
    "",
  ].join("\n")
}

/**
 * Production robots.txt — YouTube-style: one wildcard group + Sitemap.
 * Named bot blocks are unnecessary when every agent shares the same rules;
 * Googlebot/GPTBot/etc. fall back to User-agent: *.
 */
export function buildProdRobotsBody(origin: string): string {
  const disallowBlock = formatDisallowLines(DISALLOW_PATHS)

  return [
    "# www.hiffi.com — public crawl allowed; private account/admin paths disallowed",
    "User-agent: *",
    "Allow: /",
    disallowBlock,
    "",
    `Sitemap: ${origin}/sitemap.xml`,
    "",
    "# LLM agent index (discovery only — not a crawl directive)",
    `# llms.txt: ${origin}/llms.txt`,
    "",
  ].join("\n")
}
