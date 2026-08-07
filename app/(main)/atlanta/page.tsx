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

const faqItems = [
  {
    question: "What is the Atlanta Hip-Hop Guide?",
    answer:
      "The Hiffi Atlanta Hip-Hop Guide is a discovery hub for Atlanta's hip-hop scene. Browse independent artists, rap music, official music videos, genres, studios, venues, and curated guides in one place.",
  },
  {
    question: "How can I discover new Atlanta hip-hop artists?",
    answer:
      "Browse the Hiffi Artist Index to discover independent Atlanta rappers, producers, DJs, and beatmakers. Explore artist profiles, official music videos, and curated collections featuring emerging talent.",
  },
  {
    question: "What hip-hop genres are popular in Atlanta?",
    answer:
      "Atlanta is known for trap music, Southern hip-hop, drill, melodic rap, and conscious rap. The Atlanta Hip-Hop Guide helps you explore these genres through artist profiles, music videos, and curated content.",
  },
  {
    question: "Can I browse Atlanta artists by genre?",
    answer:
      "Yes. You can explore Atlanta hip-hop by genre, including trap, drill, Southern hip-hop, and other styles. Hiffi also connects genre pages with artist profiles and music discovery.",
  },
  {
    question: "Where can I find independent Atlanta rap artists?",
    answer:
      "The Hiffi Artist Index features independent Atlanta rappers, producers, DJs, and beatmakers. Browse artist profiles, watch official music videos, and discover emerging talent across the city.",
  },
  {
    question: "Can Atlanta artists claim their Hiffi profile?",
    answer:
      "Yes. Artists can claim their profile on Hiffi to manage their information, connect official links, and build their presence within the Hiffi Artist Index.",
  },
];

export default function AtlantaHubPage() {
  return (
    <AtlantaPageShell
      path="/atlanta"
      title={ATLANTA_HUB.title}
      description={ATLANTA_HUB.description}
      eyebrow="Atlanta"
      faqItems={faqItems}
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
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
        <div className="space-y-6">
          {faqItems.map((item) => (
            <div key={item.question} className="border-b border-border pb-6 last:border-0">
              <h3 className="font-semibold mb-2">{item.question}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </AtlantaPageShell>
  )
}
