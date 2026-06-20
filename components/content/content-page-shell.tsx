import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import type { ReactNode } from "react"
import { JsonLd } from "@/components/seo/json-ld"
import { sectionId } from "@/lib/content/section-id"
import { buildContentPageJsonLd } from "@/lib/seo/content-page-json-ld"
import { cn } from "@/lib/utils"

export type ContentPageSection = {
  title: string
  children: ReactNode
}

export type ContentPageCta = {
  label: string
  href: string
  external?: boolean
}

export type ContentPageRelatedLink = {
  label: string
  href: string
}

type ContentPageShellProps = {
  /** Canonical path for JSON-LD, e.g. `/about` */
  path: string
  eyebrow?: string
  title: string
  description: string
  sections: ContentPageSection[]
  cta?: ContentPageCta
  secondaryCta?: ContentPageCta
  relatedLinks?: ContentPageRelatedLink[]
  /** Shown in breadcrumb + JSON-LD; defaults to eyebrow or title */
  breadcrumbLabel?: string
  /** Override page background, e.g. white + red gradient for `/app` */
  className?: string
  /** Override hero card styling */
  heroClassName?: string
  /** Override section card styling */
  sectionClassName?: string
  /** Override sidebar + mobile TOC card styling */
  navCardClassName?: string
  /** Override bottom CTA block styling */
  ctaClassName?: string
}

function CtaLink({ cta, variant }: { cta: ContentPageCta; variant: "primary" | "secondary" }) {
  return (
    <Link
      href={cta.href}
      {...(cta.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={cn(
        "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition-all",
        variant === "primary"
          ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md"
          : "border border-border bg-background text-foreground hover:border-primary/30 hover:bg-rose-50/60",
      )}
    >
      {cta.label}
    </Link>
  )
}

export function ContentPageShell({
  path,
  eyebrow,
  title,
  description,
  sections,
  cta,
  secondaryCta,
  relatedLinks,
  breadcrumbLabel,
  className,
  heroClassName,
  sectionClassName,
  navCardClassName,
  ctaClassName,
}: ContentPageShellProps) {
  const crumb = breadcrumbLabel ?? eyebrow ?? title
  const toc = sections.map((s) => ({ id: sectionId(s.title), label: s.title }))

  const jsonLd = buildContentPageJsonLd({
    path,
    title,
    description,
    breadcrumbLabel: crumb,
  })

  return (
    <div
      className={cn(
        "min-h-full bg-gradient-to-b from-rose-50/70 via-background to-background",
        className,
      )}
    >
      <JsonLd data={jsonLd} />

      <article className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <li>
              <Link
                href="/"
                className="inline-flex items-center gap-1 rounded-md transition-colors hover:text-primary"
              >
                <Home className="h-3.5 w-3.5" aria-hidden />
                <span>Home</span>
              </Link>
            </li>
            <li aria-hidden className="text-border">
              <ChevronRight className="h-3.5 w-3.5" />
            </li>
            <li className="font-medium text-foreground/80">{crumb}</li>
          </ol>
        </nav>

        {/* Hero */}
        <header
          className={cn(
            "relative mb-10 overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur-sm sm:p-8 lg:mb-12",
            heroClassName,
          )}
        >
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl"
            aria-hidden
          />
          <div className="relative space-y-4">
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">{eyebrow}</p>
            ) : null}
            <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
              {title}
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">{description}</p>
          </div>
        </header>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-12">
          {/* Main sections */}
          <div className="space-y-6 min-w-0">
            {sections.map((section, index) => {
              const id = sectionId(section.title)
              return (
                <section
                  key={section.title}
                  id={id}
                  aria-labelledby={`${id}-heading`}
                  className={cn(
                    "scroll-mt-24 rounded-xl border border-border/70 bg-card/50 p-5 shadow-sm sm:p-6",
                    sectionClassName,
                  )}
                >
                  <div className="mb-4 flex items-start gap-3">
                    <span
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary"
                      aria-hidden
                    >
                      {index + 1}
                    </span>
                    <h2 id={`${id}-heading`} className="text-xl font-semibold text-foreground sm:text-[1.35rem]">
                      {section.title}
                    </h2>
                  </div>
                  <div
                    className={cn(
                      "content-page-prose pl-10",
                      "space-y-3 text-sm leading-relaxed text-foreground/90 sm:text-base",
                      "[&_a]:font-medium [&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline",
                      "[&_strong]:font-semibold [&_strong]:text-foreground",
                      "[&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5",
                      "[&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5",
                      "[&_p+p]:mt-3",
                    )}
                  >
                    {section.children}
                  </div>
                </section>
              )
            })}

            {(cta || secondaryCta) && (
              <section
                aria-label="Get started"
                className={cn(
                  "relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-rose-50/80 to-card p-6 sm:p-8",
                  ctaClassName,
                )}
              >
                <div
                  className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/15 blur-2xl"
                  aria-hidden
                />
                <div className="relative space-y-4">
                  <h2 className="text-lg font-semibold text-foreground">Ready to get started?</h2>
                  <p className="text-sm text-muted-foreground sm:text-base">
                    Join the Hiffi community — whether you&apos;re creating or discovering hip-hop culture.
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    {cta ? <CtaLink cta={cta} variant="primary" /> : null}
                    {secondaryCta ? <CtaLink cta={secondaryCta} variant="secondary" /> : null}
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Sidebar: TOC + related */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              <nav
                aria-label="On this page"
                className={cn("rounded-xl border border-border/70 bg-card/60 p-4", navCardClassName)}
              >
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  On this page
                </p>
                <ul className="space-y-2">
                  {toc.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className="block text-sm text-foreground/75 transition-colors hover:text-primary"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>

              {relatedLinks && relatedLinks.length > 0 ? (
                <nav
                  aria-label="Related pages"
                  className={cn("rounded-xl border border-border/70 bg-card/60 p-4", navCardClassName)}
                >
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Related
                  </p>
                  <ul className="space-y-2">
                    {relatedLinks.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="block text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              ) : null}
            </div>
          </aside>
        </div>

        {/* Mobile TOC */}
        <nav
          aria-label="On this page"
          className={cn(
            "mt-8 rounded-xl border border-border/70 bg-card/60 p-4 lg:hidden",
            navCardClassName,
          )}
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">On this page</p>
          <ul className="flex flex-wrap gap-2">
            {toc.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="inline-block rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:border-primary/30 hover:text-primary"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </article>
    </div>
  )
}
