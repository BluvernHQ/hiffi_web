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

export const AI_AND_SEARCH_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "Perplexity-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "Googlebot",
  "Bingbot",
  "Applebot",
  "Google-Extended",
  "CCBot",
] as const

export function formatDisallowLines(paths: readonly string[]): string {
  return paths.map((path) => `Disallow: ${path}`).join("\n")
}

/** One User-agent section: Allow public crawl + same Disallow list as the wildcard block. */
export function buildAgentBlock(agent: string, disallowBlock: string): string {
  return ["", `User-agent: ${agent}`, "Allow: /", disallowBlock].join("\n")
}

export function buildNonProdRobotsBody(): string {
  return ["User-agent: *", "Disallow: /", ""].join("\n")
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
