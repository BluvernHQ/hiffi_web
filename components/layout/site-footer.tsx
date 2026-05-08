import Link from "next/link"
import Image from "next/image"
import { CircleHelp, Instagram, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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
  links: Array<{ label: string; href: string }>
}

const columns: FooterColumn[] = [
  {
    title: "ABOUT US",
    links: [
      { label: "About", href: "/about" },
      { label: "Blogs", href: "/blogs" },
      { label: "Support", href: "/support" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "BUSINESS",
    links: [{ label: "Hiffi Advertising", href: "/advertising" }],
  },
  {
    title: "CREATORS",
    links: [
      { label: "Hiffi Artists", href: "/artists" },
      { label: "Hiffi Creators", href: "/creator/apply" },
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
}

export function SiteFooter({ variant = "default" }: SiteFooterProps) {
  const isApp = variant === "app"

  return (
    <footer
      className={cn(
        "border-t",
        isApp
          ? "mt-0 border-black/15 bg-[#e4e0d5] py-12 text-[#121212] md:py-14"
          : "mt-10 border-border/40 bg-rose-50/80 py-10",
      )}
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div
            className={
              isApp
                ? "font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-[#DA291C]"
                : "text-sm text-muted-foreground"
            }
          >
            Connect
          </div>
          <div
            className={cn(
              "flex items-center gap-4",
              isApp ? "text-black/55 [&_svg]:transition-colors" : "text-muted-foreground",
            )}
          >
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className={cn("transition-colors", isApp ? "hover:text-[#DA291C]" : "hover:text-foreground")}
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              className={cn("transition-colors", isApp ? "hover:text-[#DA291C]" : "hover:text-foreground")}
              aria-label="X"
            >
              <X className="h-4 w-4" />
            </a>
            <a
              href="https://tiktok.com"
              target="_blank"
              rel="noopener noreferrer"
              className={cn("transition-colors", isApp ? "hover:text-[#DA291C]" : "hover:text-foreground")}
              aria-label="TikTok"
            >
              <TikTokIcon />
            </a>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-8 sm:grid-cols-2 md:grid-cols-4">
          {columns.map((col) => (
            <div key={col.title} className="space-y-3">
              <div
                className={
                  isApp
                    ? "font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-[#DA291C]"
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
                      className={
                        isApp
                          ? "text-sm text-black/85 underline-offset-4 transition-colors hover:text-[#DA291C] hover:underline"
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

        <div className={cn("mt-10 border-t pt-6", isApp ? "border-black/15" : "border-border/40")}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Image src="/appbarlogo.png" alt="Hiffi" width={120} height={40} className="h-8 w-auto" />
            </div>

            <div
              className={
                isApp
                  ? "flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-black/65"
                  : "flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground"
              }
            >
              <Link
                href="/terms-of-use"
                className={
                  isApp
                    ? "underline-offset-4 transition-colors hover:text-[#DA291C] hover:underline"
                    : "underline-offset-4 hover:text-foreground hover:underline"
                }
              >
                Terms of use
              </Link>
              <Link
                href="/privacy-policy"
                className={
                  isApp
                    ? "underline-offset-4 transition-colors hover:text-[#DA291C] hover:underline"
                    : "underline-offset-4 hover:text-foreground hover:underline"
                }
              >
                Privacy Policy
              </Link>
              <Link
                href="/payment-terms"
                className={
                  isApp
                    ? "underline-offset-4 transition-colors hover:text-[#DA291C] hover:underline"
                    : "underline-offset-4 hover:text-foreground hover:underline"
                }
              >
                Payment Terms
              </Link>
            </div>

            <Button
              asChild
              variant={isApp ? "outline" : "secondary"}
              size="sm"
              className={
                isApp
                  ? "h-10 w-fit gap-2 rounded-none border-2 border-black bg-[#fffdf8] text-black shadow-[5px_5px_0_#111] transition-all hover:translate-x-px hover:translate-y-px hover:bg-black hover:text-white hover:shadow-[4px_4px_0_#DA291C]"
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

