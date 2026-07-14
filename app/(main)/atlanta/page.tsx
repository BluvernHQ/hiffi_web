import type { Metadata } from "next"
import Link from "next/link"
import { AtlantaPageShell } from "@/components/atlanta/AtlantaPageShell"
import { ATLANTA_HUB, ATLANTA_HUB_CATEGORIES, ATLANTA_HUB_QUICK_LINKS } from "@/lib/atlanta/hub"
import { buildAtlantaMetadata } from "@/lib/atlanta/metadata"

export const metadata: Metadata = buildAtlantaMetadata({
  title: ATLANTA_HUB.title,
  description: ATLANTA_HUB.description,
  path: "/atlanta",
  keywords: ATLANTA_HUB.keywords,
})

export default function AtlantaHubPage() {
  return (
    <AtlantaPageShell
      path="/atlanta"
      title={ATLANTA_HUB.title}
      description={ATLANTA_HUB.description}
      eyebrow="Atlanta"
      cta={{ label: "Browse Atlanta artists", href: "/artist-index/city/atlanta" }}
      secondaryCta={{ label: "Read the scene guide", href: "/artist-index/city/atlanta/scene" }}
    >
      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
        {ATLANTA_HUB.intro}
      </p>

      <section aria-labelledby="atlanta-categories-heading" className="space-y-4">
        <h2 id="atlanta-categories-heading" className="text-lg font-bold tracking-tight text-foreground">
          Browse by category
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ATLANTA_HUB_CATEGORIES.map((card) => (
            <li key={card.category}>
              <Link
                href={card.href}
                className="group flex h-full flex-col rounded-xl border border-border/70 bg-card/50 p-5 transition-colors hover:border-primary/40"
              >
                <h3 className="text-base font-semibold text-foreground group-hover:text-primary">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{card.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="atlanta-quick-links-heading" className="space-y-3">
        <h2 id="atlanta-quick-links-heading" className="text-lg font-bold tracking-tight text-foreground">
          Start here
        </h2>
        <ul className="flex flex-wrap gap-2">
          {ATLANTA_HUB_QUICK_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="inline-flex rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </AtlantaPageShell>
  )
}
