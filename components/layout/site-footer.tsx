import Link from "next/link"
import Image from "next/image"
import { CircleHelp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CONTENT_PAGE_LINKS } from "@/lib/content-pages"
import { HIFFI_SOCIAL_PROFILES } from "@/lib/seo/social"

const socialLinks = [
  {
    label: "Instagram",
    href: HIFFI_SOCIAL_PROFILES.instagram,
    iconSrc: "/artist-claim/icons/instagram.svg",
  },
  {
    label: "X",
    href: HIFFI_SOCIAL_PROFILES.x,
    iconSrc: "/artist-claim/icons/twitter.svg",
  },
  {
    label: "YouTube",
    href: HIFFI_SOCIAL_PROFILES.youtube,
    iconSrc: "/artist-claim/icons/youtube.svg",
  },
] as const

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
      { label: "Creators for Change", href: "/creators-for-change" },
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
      { label: "Request a feature", href: "/feature-request" },
    ],
  },
  {
    title: "DISCOVER",
    links: [
      { label: "Hip-Hop", href: "/hip-hop" },
      { label: "Artist Index", href: "/artist-index" },
      { label: "Hiffi 500", href: "/top-artists" },
      { label: "Atlanta guide", href: "/atlanta" },
      { label: "Atlanta artists", href: "/artist-index/city/atlanta" },
      { label: "Claim your profile", href: "/artist-index/claim" },
      { label: "Download app", href: "/app" },
    ],
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
        <div className="mb-8 flex items-center gap-4">
          <p
            className={
              isApp
                ? "font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-primary"
                : "text-sm font-semibold text-foreground"
            }
          >
            Connect
          </p>
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center transition-opacity hover:opacity-70"
                aria-label={social.label}
              >
                <Image
                  src={social.iconSrc}
                  alt=""
                  width={20}
                  height={20}
                  className="h-5 w-5 object-contain"
                  aria-hidden
                />
              </a>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-3 lg:grid-cols-5">
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

