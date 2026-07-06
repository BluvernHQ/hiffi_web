import { ARTIST_INDEX_FAQ } from "@/lib/artist-directory-seo"
import { artistPanelShell } from "@/components/artists/artist-styles"
import { cn } from "@/lib/utils"

type FaqItem = {
  question: string
  answer: string
}

type ArtistIndexFaqProps = {
  className?: string
  items?: readonly FaqItem[]
  title?: string
  description?: string
}

export function ArtistIndexFaq({
  className,
  items = ARTIST_INDEX_FAQ,
  title = "Artist Index FAQ",
  description = "How claiming, verification, and profile suggestions work on Hiffi.",
}: ArtistIndexFaqProps) {
  return (
    <section
      aria-labelledby="artist-index-faq-heading"
      className={cn(artistPanelShell, "border border-border bg-muted/15 px-6 py-8 sm:px-8", className)}
    >
      <h2 id="artist-index-faq-heading" className="text-xl font-bold tracking-tight text-foreground">
        {title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>

      <dl className="mt-6 space-y-5">
        {items.map((item) => (
          <div key={item.question} className="border-t border-border/70 pt-5 first:border-t-0 first:pt-0">
            <dt className="text-sm font-semibold text-foreground">{item.question}</dt>
            <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
