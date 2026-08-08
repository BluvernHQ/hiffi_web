import Link from "next/link"
import type { AtlantaCrossLinkGroup } from "@/lib/atlanta/types"
import { cn } from "@/lib/utils"

type AtlantaCrossLinksProps = {
  groups: AtlantaCrossLinkGroup[]
  className?: string
  /** Accessible name for the nav landmark */
  label?: string
}

export function AtlantaCrossLinks({
  groups,
  className,
  label = "Related Atlanta pages",
}: AtlantaCrossLinksProps) {
  const nonEmpty = groups.filter((group) => group.links.length > 0)
  if (nonEmpty.length === 0) return null

  return (
    <nav
      aria-label={label}
      className={cn("space-y-6 rounded-2xl border border-border/80 bg-muted/15 px-5 py-6 sm:px-6", className)}
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        You might also like
      </p>
      <div className="space-y-5">
        {nonEmpty.map((group) => (
          <div key={group.heading}>
            <h2 className="text-sm font-semibold text-foreground">{group.heading}</h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {group.links.map((link) => (
                <li key={`${group.heading}-${link.href}`}>
                  <Link
                    href={link.href}
                    className="inline-flex rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  )
}
