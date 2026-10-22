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
  variant?: "default" | "roster"
}

export function ArtistIndexFaq({
  className,
  items = ARTIST_INDEX_FAQ,
  title = "Artist Index FAQ",
  description = "How claiming, verification, and profile suggestions work on Hiffi.",
  variant = "default",
}: ArtistIndexFaqProps) {
  if (variant === "roster") {
    return (
      <section
        aria-labelledby="artist-index-faq-heading"
        className={cn("border-t border-[#0B0B0C]/10 pt-12 sm:pt-16", className)}
      >
        <div className="max-w-3xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#77726A] sm:text-[11px]">
            Frequently Asked Questions
          </p>
          <h2
            id="artist-index-faq-heading"
            className="font-signal mt-3 text-[clamp(2rem,4vw,3.25rem)] font-bold uppercase leading-[0.9] text-[#0B0B0C]"
          >
            {title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#77726A] sm:text-base">
            {description}
          </p>
        </div>

        <dl className="mt-10 grid gap-6 sm:grid-cols-2 sm:gap-x-12 sm:gap-y-10">
          {items.map((item) => (
            <div key={item.question} className="border-t border-[#0B0B0C]/10 pt-4">
              <dt className="text-base font-semibold text-[#0B0B0C]">{item.question}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-[#77726A]">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </section>
    )
  }

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
