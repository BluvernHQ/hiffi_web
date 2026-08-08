import { writeFileSync } from "fs"
import {
  ATLANTA_HUB,
  ATLANTA_HUB_CATEGORIES,
  ATLANTA_HUB_QUICK_LINKS,
} from "../lib/atlanta/hub"
import { ATLANTA_GENRES } from "../lib/atlanta/genres"
import { ATLANTA_BEST_OF } from "../lib/atlanta/best-of"
import { ATLANTA_ERAS } from "../lib/atlanta/eras"
import { ATLANTA_STUDIOS } from "../lib/atlanta/studios"
import { ATLANTA_VENUES } from "../lib/atlanta/venues"

type LinkGroup = { heading: string; links: { label: string; href: string }[] }
type Section = { heading: string; paragraphs: string[] }

function links(groups: LinkGroup[]) {
  return groups
    .map(
      (g) =>
        `**${g.heading}**\n` + g.links.map((l) => `- [${l.label}](${l.href})`).join("\n"),
    )
    .join("\n\n")
}

function sections(secs?: Section[]) {
  if (!secs?.length) return ""
  return (
    secs.map((s) => `### ${s.heading}\n\n` + s.paragraphs.join("\n\n")).join("\n\n") +
    "\n\n"
  )
}

const lines: string[] = []

lines.push("# Atlanta Content Cluster — Routes & Content Export")
lines.push("")
lines.push("> Status: **scaffold / placeholder editorial** (not final curated copy).")
lines.push("> Source: `lib/atlanta/*.ts`")
lines.push("")
lines.push("## Route index")
lines.push("")
lines.push("| Route | Title |")
lines.push("|---|---|")
lines.push(`| \`/atlanta\` | ${ATLANTA_HUB.title} |`)
lines.push("| `/atlanta/genres` | Atlanta Genre Hubs |")
for (const p of ATLANTA_GENRES) {
  lines.push(`| \`/atlanta/genres/${p.slug}\` | ${p.title} |`)
}
lines.push("| `/atlanta/best-of` | Atlanta Best-Of Lists |")
for (const p of ATLANTA_BEST_OF) {
  lines.push(`| \`/atlanta/best-of/${p.slug}\` | ${p.title} |`)
}
lines.push("| `/atlanta/eras` | Atlanta Hip-Hop Eras |")
for (const p of ATLANTA_ERAS) {
  lines.push(`| \`/atlanta/eras/${p.slug}\` | ${p.title} |`)
}
lines.push("| `/atlanta/studios` | Studios, Labels & Producers |")
for (const p of ATLANTA_STUDIOS) {
  lines.push(`| \`/atlanta/studios/${p.slug}\` | ${p.title} |`)
}
lines.push("| `/atlanta/venues` | Atlanta Venues |")
for (const p of ATLANTA_VENUES) {
  lines.push(`| \`/atlanta/venues/${p.slug}\` | ${p.title} |`)
}
lines.push("")

lines.push("---")
lines.push("")
lines.push("## `/atlanta` — Hub")
lines.push("")
lines.push(`**Title:** ${ATLANTA_HUB.title}`)
lines.push("")
lines.push(`**Description:** ${ATLANTA_HUB.description}`)
lines.push("")
lines.push(`**Intro:** ${ATLANTA_HUB.intro}`)
lines.push("")
lines.push(`**Keywords:** ${ATLANTA_HUB.keywords.join(", ")}`)
lines.push("")
lines.push("### Category cards")
lines.push("")
for (const c of ATLANTA_HUB_CATEGORIES) {
  lines.push(`- **[${c.title}](${c.href})** — ${c.description}`)
}
lines.push("")
lines.push("### Quick links")
lines.push("")
for (const l of ATLANTA_HUB_QUICK_LINKS) {
  lines.push(`- [${l.label}](${l.href})`)
}
lines.push("")

function pageHeader(
  route: string,
  title: string,
  description: string,
  intro: string,
  keywords?: string[],
) {
  lines.push("---")
  lines.push("")
  lines.push(`## \`${route}\``)
  lines.push("")
  lines.push(`**Title:** ${title}`)
  lines.push("")
  lines.push(`**Description:** ${description}`)
  lines.push("")
  lines.push(`**Intro:** ${intro}`)
  if (keywords?.length) {
    lines.push("")
    lines.push(`**Keywords:** ${keywords.join(", ")}`)
  }
  lines.push("")
}

lines.push("---")
lines.push("")
lines.push("## Category indexes")
lines.push("")
lines.push("### `/atlanta/genres`")
lines.push("")
lines.push("Lists all genre hubs (directory of detail pages below).")
lines.push("")
lines.push("### `/atlanta/best-of`")
lines.push("")
lines.push("Lists all best-of pages.")
lines.push("")
lines.push("### `/atlanta/eras`")
lines.push("")
lines.push("Lists all era guides (chronological).")
lines.push("")
lines.push("### `/atlanta/studios`")
lines.push("")
lines.push("Lists all studio / label / producer profiles.")
lines.push("")
lines.push("### `/atlanta/venues`")
lines.push("")
lines.push("Lists all venue pages.")
lines.push("")

lines.push("# Genres")
lines.push("")
for (const p of ATLANTA_GENRES) {
  pageHeader(`/atlanta/genres/${p.slug}`, p.title, p.description, p.intro, p.keywords)
  if (p.sections?.length) {
    lines.push(sections(p.sections).trimEnd())
    lines.push("")
  }
  lines.push("### Cross-links")
  lines.push("")
  lines.push(links(p.crossLinks))
  lines.push("")
}

lines.push("# Best-of")
lines.push("")
for (const p of ATLANTA_BEST_OF) {
  pageHeader(`/atlanta/best-of/${p.slug}`, p.title, p.description, p.intro, p.keywords)
  if (p.lastUpdated) {
    lines.push(`**Last updated:** ${p.lastUpdated}`)
    lines.push("")
  }
  lines.push("### Ranked entries")
  lines.push("")
  for (const e of p.entries) {
    const sub = e.subtitle ? ` — *${e.subtitle}*` : ""
    const blurb = e.blurb ? `: ${e.blurb}` : ""
    lines.push(`${e.rank}. **${e.title}**${sub}${blurb}`)
  }
  lines.push("")
  lines.push("### Cross-links")
  lines.push("")
  lines.push(links(p.crossLinks))
  lines.push("")
}

lines.push("# Eras")
lines.push("")
for (const p of ATLANTA_ERAS) {
  pageHeader(`/atlanta/eras/${p.slug}`, p.title, p.description, p.intro, p.keywords)
  if (p.years) {
    lines.push(`**Years:** ${p.years}`)
    lines.push("")
  }
  lines.push(sections(p.sections).trimEnd())
  lines.push("")
  lines.push("### Cross-links")
  lines.push("")
  lines.push(links(p.crossLinks))
  lines.push("")
}

lines.push("# Studios / Labels / Producers")
lines.push("")
for (const p of ATLANTA_STUDIOS) {
  pageHeader(`/atlanta/studios/${p.slug}`, p.title, p.description, p.intro, p.keywords)
  lines.push(`**Kind:** ${p.kind}`)
  lines.push("")
  if (p.neighborhood) {
    lines.push(`**Neighborhood:** ${p.neighborhood}`)
    lines.push("")
  }
  if (p.address) {
    lines.push(`**Address:** ${p.address}`)
    lines.push("")
  }
  lines.push("### Bio")
  lines.push("")
  lines.push(p.bio)
  lines.push("")
  lines.push("### Notable")
  lines.push("")
  for (const n of p.notable) lines.push(`- ${n}`)
  lines.push("")
  if (p.timeline?.length) {
    lines.push("### Timeline")
    lines.push("")
    for (const t of p.timeline) lines.push(`- **${t.year}** — ${t.label}`)
    lines.push("")
  }
  lines.push("### Cross-links")
  lines.push("")
  lines.push(links(p.crossLinks))
  lines.push("")
}

lines.push("# Venues")
lines.push("")
for (const p of ATLANTA_VENUES) {
  pageHeader(`/atlanta/venues/${p.slug}`, p.title, p.description, p.intro, p.keywords)
  lines.push(`**Kind:** ${p.kind}`)
  lines.push("")
  if (p.neighborhood) {
    lines.push(`**Neighborhood:** ${p.neighborhood}`)
    lines.push("")
  }
  if (p.address) {
    lines.push(`**Address:** ${p.address}`)
    lines.push("")
  }
  lines.push("### Bio")
  lines.push("")
  lines.push(p.bio)
  lines.push("")
  lines.push("### Notable")
  lines.push("")
  for (const n of p.notable) lines.push(`- ${n}`)
  lines.push("")
  if (p.timeline?.length) {
    lines.push("### Timeline")
    lines.push("")
    for (const t of p.timeline) lines.push(`- **${t.year}** — ${t.label}`)
    lines.push("")
  }
  lines.push("### Cross-links")
  lines.push("")
  lines.push(links(p.crossLinks))
  lines.push("")
}

const out = "docs/atlanta-pages-content.md"
const body = lines.join("\n")
writeFileSync(out, body)
console.log(`Wrote ${out} (${lines.length} lines, ${Buffer.byteLength(body)} bytes)`)
