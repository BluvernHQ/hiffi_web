import { readFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import { MOODS, type MoodDef } from "@/lib/mood-tabs"
import { absoluteUrl } from "@/lib/seo/site"

const CONTENT_DIR = join(process.cwd(), "content/llms")

function moodSlugFromQuery(query: string): string {
  return query.replace(/\s+/g, "-").toLowerCase()
}

function moodFromSlug(slug: string): MoodDef | undefined {
  const decoded = decodeURIComponent(slug).toLowerCase()
  return MOODS.find(
    (m) =>
      moodSlugFromQuery(m.query) === decoded ||
      m.query.toLowerCase() === decoded,
  )
}

function generateMoodMarkdown(mood: MoodDef): string {
  const slug = moodSlugFromQuery(mood.query)
  const pageUrl = absoluteUrl(`/hip-hop/mood/${slug}`)

  return `# ${mood.label} — ${mood.vibe}

> ${mood.tagline}

${mood.cluster} hip-hop mood hub on Hiffi. Discover ${mood.vibe} music videos from independent rap artists — no algorithms, no gatekeeping.

- **Mood:** ${mood.label}
- **Vibe:** ${mood.vibe}
- **Cluster:** ${mood.cluster}
- **URL:** ${pageUrl}
- **Hip-hop hub:** ${absoluteUrl("/hip-hop")}
`
}

/** Resolve a site path (e.g. `/faq`) to LLM-readable markdown, or null if unknown. */
export function getLlmsMarkdown(pathname: string): string | null {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`

  const moodMatch = path.match(/^\/hip-hop\/mood\/([^/]+)$/)
  if (moodMatch) {
    const mood = moodFromSlug(moodMatch[1])
    return mood ? generateMoodMarkdown(mood) : null
  }

  const relativeFile = join(CONTENT_DIR, `${path.slice(1)}.md`)
  if (existsSync(relativeFile)) {
    return readFileSync(relativeFile, "utf8")
  }

  return null
}
