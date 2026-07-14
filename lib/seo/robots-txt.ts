import { getSiteOrigin } from "@/lib/seo/site"
import { buildNonProdRobotsBody, buildProdRobotsBody } from "./robots-txt-core"

export { buildAgentBlock } from "./robots-txt-core"

/** Plain-text robots.txt (supports llms.txt comment; MetadataRoute.Robots cannot). */
export function buildRobotsTxt(): string {
  const isProdEnv = (process.env.NEXT_PUBLIC_ENV || "beta").toLowerCase() === "prod"

  if (!isProdEnv) {
    return buildNonProdRobotsBody()
  }

  return buildProdRobotsBody(getSiteOrigin())
}
