import Link from "next/link"
import {
  getAtlantaGenreLinks,
  getAtlantaSceneSections,
} from "@/lib/artist-index/city-seo-content"
import { cn } from "@/lib/utils"

type ArtistCitySceneProps = {
  citySlug: string
  cityLabel: string
  profileCount: number
  className?: string
  /** When true, the page wrapper supplies the H1 — omit the card headline block. */
  asPage?: boolean
}

export function ArtistCityScene({
  citySlug,
  cityLabel,
  profileCount,
  className,
  asPage = false,
}: ArtistCitySceneProps) {
  if (citySlug !== "atlanta") return null

  const sections = getAtlantaSceneSections(profileCount)
  const genreLinks = getAtlantaGenreLinks()
  const countLabel = profileCount > 0 ? profileCount.toLocaleString() : "800"

  return (
    <article
      aria-labelledby={asPage ? undefined : "city-scene-heading"}
      className={cn(
        asPage ? "space-y-6" : "rounded-2xl border border-border/80 bg-muted/15 px-5 py-6 sm:px-7 sm:py-8",
        className,
      )}
    >
      {!asPage ? (
        <>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            About the {cityLabel} scene
          </p>
          <h2 id="city-scene-heading" className="mt-2 text-xl font-bold tracking-tight text-foreground">
            Why Hiffi indexed {countLabel}+ Atlanta artists
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Context for fans, artists, and search — the full browsable directory is above.
          </p>
        </>
      ) : null}

      <div className={cn(!asPage && "mt-6", "space-y-6")}>
        {sections.map((section) => (
          <section key={section.heading} aria-labelledby={`scene-${section.heading}`}>
            {asPage ? (
              <h2
                id={`scene-${section.heading}`}
                className="text-lg font-bold tracking-tight text-foreground sm:text-xl"
              >
                {section.heading}
              </h2>
            ) : (
              <h3
                id={`scene-${section.heading}`}
                className="text-base font-semibold tracking-tight text-foreground"
              >
                {section.heading}
              </h3>
            )}
            <div className="mt-2 space-y-2">
              {section.paragraphs.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 48)}
                  className="max-w-3xl text-sm leading-relaxed text-muted-foreground"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <nav aria-label="Atlanta genre links" className="mt-6 flex flex-wrap gap-2 border-t border-border/70 pt-5">
        {genreLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </article>
  )
}
