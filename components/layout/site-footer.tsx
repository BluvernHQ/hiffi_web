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

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-border/40 bg-rose-50/80">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">Connect</div>
          <div className="flex items-center gap-4 text-muted-foreground">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
              aria-label="X"
            >
              <X className="h-4 w-4" />
            </a>
            <a
              href="https://tiktok.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
              aria-label="TikTok"
            >
              <TikTokIcon />
            </a>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-8 sm:grid-cols-2 md:grid-cols-4">
          {columns.map((col) => (
            <div key={col.title} className="space-y-3">
              <div className="text-xs font-semibold tracking-wide text-primary/80">{col.title}</div>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-foreground/90 hover:text-foreground hover:underline underline-offset-4"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-border/40 pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Image src="/hiffi_logo.png" alt="Hiffi" width={96} height={32} className="h-8 w-auto" />
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <Link href="/terms-of-use" className="hover:text-foreground hover:underline underline-offset-4">
                Terms of use
              </Link>
              <Link href="/privacy-policy" className="hover:text-foreground hover:underline underline-offset-4">
                Privacy Policy
              </Link>
              <Link href="/payment-terms" className="hover:text-foreground hover:underline underline-offset-4">
                Payment Terms
              </Link>
            </div>

            <Button asChild variant="secondary" size="sm" className="w-fit rounded-full">
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

