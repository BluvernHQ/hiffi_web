export const DISALLOW_PATHS = [
  "/admin/",
  "/api/",
  "/studio",
  "/login",
  "/signup",
  "/forgot-password",
  "/history",
  "/following",
  "/liked",
  "/playlists",
  // Intentional product path (referral links), not a spelling mistake — see app/referrar/
  "/referrar/",
] as const

/** AI / LLM crawlers — allowed on non-prod (dev/beta) so agents can read staging. */
export const AI_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "Perplexity-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "Google-Extended",
  "CCBot",
  "anthropic-ai",
  "Claude-Web",
] as const

/** Traditional search crawlers (prod allow-list alongside AI bots). */
export const SEARCH_BOTS = ["Googlebot", "Bingbot", "Applebot"] as const

export const AI_AND_SEARCH_BOTS = [...AI_BOTS, ...SEARCH_BOTS] as const

export function formatDisallowLines(paths: readonly string[]): string {
  return paths.map((path) => `Disallow: ${path}`).join("\n")
}

/** One User-agent section: Allow public crawl + same Disallow list as the wildcard block. */
export function buildAgentBlock(agent: string, disallowBlock: string): string {
  return ["", `User-agent: ${agent}`, "Allow: /", disallowBlock].join("\n")
}

/**
 * Non-prod (dev/beta): keep generic crawlers off the index (`Disallow: /`),
 * but explicitly Allow AI bots so ChatGPT / Claude / Perplexity can access e.g. dev.hiffi.com.
 */
export function buildNonProdRobotsBody(): string {
  const aiBlocks = AI_BOTS.map((agent) =>
    ["", `User-agent: ${agent}`, "Allow: /"].join("\n"),
  ).join("\n")

  return [
    "User-agent: *",
    "Disallow: /",
    aiBlocks,
    "",
    "# AI bots allowed on non-prod for agent / GEO access; search engines remain blocked.",
    "",
  ].join("\n")
}

export function buildProdRobotsBody(origin: string): string {
  const disallowBlock = formatDisallowLines(DISALLOW_PATHS)
  const botBlocks = AI_AND_SEARCH_BOTS.map((agent) => buildAgentBlock(agent, disallowBlock)).join(
    "\n",
  )

  return [
    "User-agent: *",
    "Allow: /",
    disallowBlock,
    botBlocks,
    "",
    `Host: ${origin}`,
    `Sitemap: ${origin}/sitemap.xml`,
    "",
    "# LLM agent index (discovery only — not a crawl directive)",
    `# llms.txt: ${origin}/llms.txt`,
    "",
  ].join("\n")
}
