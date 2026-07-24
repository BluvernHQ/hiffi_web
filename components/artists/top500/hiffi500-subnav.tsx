import Link from "next/link"
import { cn } from "@/lib/utils"
import { HIFFI_500_NAV_LINKS, HIFFI_500_PATH } from "@/lib/top-artists"

export function Hiffi500Subnav({ currentPath }: { currentPath: string }) {
  return (
    <nav
      aria-label="Hiffi 500 sections"
      className="-mx-1 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none sm:gap-2"
    >
      {HIFFI_500_NAV_LINKS.map((link) => {
        const active =
          link.href === HIFFI_500_PATH
            ? currentPath === HIFFI_500_PATH
            : currentPath === link.href || currentPath.startsWith(`${link.href}/`)
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors sm:px-4 sm:py-2.5 sm:text-base",
              active
                ? "bg-[#E8192C] text-white"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
