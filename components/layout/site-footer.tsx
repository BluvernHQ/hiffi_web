import Link from "next/link"
import Image from "next/image"
import { CircleHelp, Instagram, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CONTENT_PAGE_LINKS } from "@/lib/content-pages"
import { HIFFI_SOCIAL_PROFILES } from "@/lib/seo/social"

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={cn("h-4 w-4", className)}
    >
      <path d="M21 8.1c-1.2.1-2.4-.3-3.3-1.1-.9-.8-1.4-2-1.4-3.2h-3.4v12.2c0 1.2-1 2.2-2.2 2.2s-2.2-1-2.2-2.2 1-2.2 2.2-2.2c.4 0 .8.1 1.1.3V10.7c-.4-.1-.8-.1-1.1-.1-3.1 0-5.6 2.5-5.6 5.6S6.6 21.8 9.7 21.8s5.6-2.5 5.6-5.6V9.9c1.6 1.1 3.6 1.6 5.6 1.3V8.1z" />
    </svg>
  )
}

type FooterColumn = {
  title: string
  links: Array<{ label: string; href: string; external?: boolean }>
}

const columns: FooterColumn[] = [
  {
    title: "LEGAL",
    links: [...CONTENT_PAGE_LINKS],
  },
  {
    title: "ABOUT US",
    links: [
      { label: "About", href: "/about" },
      { label: "What is Hiffi?", href: "/what-is-hiffi" },
      { label: "How it works", href: "/how-it-works" },
      { label: "Press kit", href: "/press" },
      { label: "Blog", href: "https://www.blog.hiffi.com/", external: true },
    ],
  },
  {
    title: "BUSINESS",
    links: [
      { label: "Hiffi Advertising", href: "/advertising" },
      { label: "Brand collaboration", href: "/collaborate" },
    ],
  },
  {
    title: "CREATORS",
    links: [
      { label: "Hiffi Artists", href: "/artists" },
      { label: "Creator Playbook", href: "/creator-playbook" },
      { label: "Apply as creator", href: "/creator/apply" },
    ],
  },
  {
    title: "DISCOVER",
    links: [
      { label: "Hip-Hop", href: "/hip-hop" },
      { label: "Search", href: "/search" },
    ],
  },
  {
    title: "COMMITMENTS",
    links: [{ label: "Creators for Change", href: "/creators-for-change" }],
  },
]

export type SiteFooterVariant = "default" | "app"

type SiteFooterProps = {
  variant?: SiteFooterVariant
  className?: string
}

export function SiteFooter({ variant = "default", className }: SiteFooterProps) {
  const isApp = variant === "app"

  return (
    <footer
      className={cn(
        "border-t",
        isApp
          ? "mt-0 border-red-100 bg-gradient-to-b from-red-50/40 to-white py-12 text-foreground md:py-14"
          : "mt-10 border-border/40 bg-rose-50/80 py-10",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div
            className={
              isApp
                ? "font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-primary"
                : "text-sm text-muted-foreground"
            }
          >
            Connect
          </div>
          <div
            className={cn(
              "flex items-center gap-4",
              isApp ? "text-foreground/55 [&_svg]:transition-colors" : "text-muted-foreground",
            )}
          >
            <a
              href={HIFFI_SOCIAL_PROFILES.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className={cn("transition-colors", isApp ? "hover:text-primary" : "hover:text-foreground")}
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href={HIFFI_SOCIAL_PROFILES.x}
              target="_blank"
              rel="noopener noreferrer"
              className={cn("transition-colors", isApp ? "hover:text-primary" : "hover:text-foreground")}
              aria-label="X"
            >
              <X className="h-4 w-4" />
            </a>
            <a
              href={HIFFI_SOCIAL_PROFILES.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              className={cn("transition-colors", isApp ? "hover:text-primary" : "hover:text-foreground")}
              aria-label="TikTok"
            >
              <TikTokIcon />
            </a>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {columns.map((col) => (
            <div key={col.title} className="space-y-3">
              <div
                className={
                  isApp
                    ? "font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-primary"
                    : "text-xs font-semibold tracking-wide text-primary/80"
                }
              >
                {col.title}
              </div>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      {...(l.external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                      className={
                        isApp
                          ? "text-sm text-foreground/85 underline-offset-4 transition-colors hover:text-primary hover:underline"
                          : "text-sm text-foreground/90 underline-offset-4 hover:text-foreground hover:underline"
                      }
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className={cn("mt-10 border-t pt-6", isApp ? "border-red-100" : "border-border/40")}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/appbarlogo.png"
                alt="Hiffi"
                width={120}
                height={40}
                className="h-8 w-auto"
                style={{ width: "auto" }}
              />
            </div>

            <div
              className={
                isApp
                  ? "flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-foreground/65"
                  : "flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground"
              }
            >
              {CONTENT_PAGE_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={
                    isApp
                      ? "underline-offset-4 transition-colors hover:text-primary hover:underline"
                      : "underline-offset-4 hover:text-foreground hover:underline"
                  }
                >
                  {label}
                </Link>
              ))}
            </div>

            <Button
              asChild
              variant={isApp ? "outline" : "secondary"}
              size="sm"
              className={
                isApp
                  ? "h-10 w-fit gap-2 rounded-none border-2 border-primary/25 bg-white text-foreground shadow-[5px_5px_0_rgba(237,28,47,0.12)] transition-all hover:translate-x-px hover:translate-y-px hover:bg-primary hover:text-primary-foreground hover:shadow-[4px_4px_0_rgba(237,28,47,0.25)]"
                  : "w-fit rounded-full"
              }
            >
              <a href="mailto:care@hiffi.com" className="gap-2">
                <CircleHelp className="h-4 w-4" />
                Help
              </a>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  )
}

