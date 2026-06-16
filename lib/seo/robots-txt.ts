import { getSiteOrigin } from "@/lib/seo/site"

const DISALLOW_PATHS = [
  "/admin/",
  "/api/",
  "/upload",
  "/login",
  "/signup",
  "/forgot-password",
  "/history",
  "/following",
  "/liked",
  "/playlists",
  "/referrar/",
] as const

const AI_AND_SEARCH_BOTS = [
  "GPTBot",
  "ChatGPT-User",
  "Google-Extended",
  "Googlebot",
  "Bingbot",
  "PerplexityBot",
  "ClaudeBot",
  "anthropic-ai",
  "Applebot",
  "CCBot",
] as const

function formatDisallowLines(paths: readonly string[]): string {
  return paths.map((path) => `Disallow: ${path}`).join("\n")
}

/** Plain-text robots.txt (supports llms.txt comment; MetadataRoute.Robots cannot). */
export function buildRobotsTxt(): string {
  const origin = getSiteOrigin()
  const isProdEnv = (process.env.NEXT_PUBLIC_ENV || "beta").toLowerCase() === "prod"

  if (!isProdEnv) {
    return ["User-agent: *", "Disallow: /", ""].join("\n")
  }

  const disallowBlock = formatDisallowLines(DISALLOW_PATHS)
  const botBlocks = AI_AND_SEARCH_BOTS.map(
    (agent) => ["", `User-agent: ${agent}`, "Allow: /"].join("\n"),
  ).join("\n")

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
