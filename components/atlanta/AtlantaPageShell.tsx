import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import type { ReactNode } from "react"
import { AtlantaCrossLinks } from "@/components/atlanta/AtlantaCrossLinks"
import { JsonLd } from "@/components/seo/json-ld"
import type { AtlantaCategory, AtlantaCrossLinkGroup } from "@/lib/atlanta/types"
import { ATLANTA_CATEGORY_LABELS, atlantaCategoryHref } from "@/lib/atlanta/registry"
import { buildContentPageJsonLd } from "@/lib/seo/content-page-json-ld"
import { cn } from "@/lib/utils"

export type AtlantaBreadcrumb = {
  label: string
  href?: string
}

type AtlantaPageShellProps = {
  path: string
  title: string
  description: string
  eyebrow?: string
  category?: AtlantaCategory
  /** Extra crumbs after Home → Atlanta (and optional category) */
  breadcrumbs?: AtlantaBreadcrumb[]
  children?: ReactNode
  crossLinks?: AtlantaCrossLinkGroup[]
  afterCrossLinks?: ReactNode
  cta?: { label: string; href: string }
  secondaryCta?: { label: string; href: string }
  headerExtra?: ReactNode
  faqItems?: Array<{ question: string; answer: string }>
  className?: string
}

export function AtlantaPageShell({
  path,
  title,
  description,
  eyebrow,
  category,
  breadcrumbs,
  children,
  crossLinks,
  afterCrossLinks,
  cta,
  secondaryCta,
  headerExtra,
  faqItems,
  className,
}: AtlantaPageShellProps) {
  const crumbs: AtlantaBreadcrumb[] = [
    { label: "Atlanta", href: "/atlanta" },
    ...(category
      ? [{ label: ATLANTA_CATEGORY_LABELS[category], href: atlantaCategoryHref(category) }]
      : []),
    ...(breadcrumbs ?? []),
  ]

  const jsonLd = buildContentPageJsonLd({
    path,
    title,
    description,
    breadcrumbLabel: title,
    faqItems,
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
            {crumbs.map((crumb) => (
              <li key={crumb.label} className="flex items-center gap-1.5">
                <ChevronRight className="h-3.5 w-3.5 text-border" aria-hidden />
                {crumb.href ? (
                  <Link href={crumb.href} className="transition-colors hover:text-primary">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="font-medium text-foreground/80">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <header className="relative mb-10 overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur-sm sm:p-8 lg:mb-12">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
            aria-hidden
          />
          <div className="relative space-y-4">
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">{eyebrow}</p>
            ) : null}
            <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
              {title}
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {description}
            </p>
            {headerExtra}
          </div>
        </header>

        <div className="space-y-10">
          {children}

          {crossLinks && crossLinks.length > 0 ? (
            <AtlantaCrossLinks groups={crossLinks} />
          ) : null}

          {afterCrossLinks}

          {(cta || secondaryCta) && (
            <section
              aria-label="Continue exploring"
              className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-rose-50/80 to-card p-6 sm:p-8"
            >
              <div className="relative space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Keep exploring Atlanta</h2>
                <p className="text-sm text-muted-foreground sm:text-base">
                  Browse living artist profiles or dig into the longer scene guide.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  {cta ? (
                    <Link
                      href={cta.href}
                      className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
                    >
                      {cta.label}
                    </Link>
                  ) : null}
                  {secondaryCta ? (
                    <Link
                      href={secondaryCta.href}
                      className="inline-flex items-center justify-center rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition-all hover:border-primary/30"
                    >
                      {secondaryCta.label}
                    </Link>
                  ) : null}
                </div>
              </div>
            </section>
          )}
        </div>
      </article>
    </div>
  )
}
