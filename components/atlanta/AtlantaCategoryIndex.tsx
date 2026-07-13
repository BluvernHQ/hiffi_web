import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

export type AtlantaIndexItem = {
  slug: string
  title: string
  description: string
  href: string
  meta?: string
}

type AtlantaCategoryIndexProps = {
  items: AtlantaIndexItem[]
  className?: string
}

export function AtlantaCategoryIndex({ items, className }: AtlantaCategoryIndexProps) {
  return (
    <ul className={cn("grid gap-3 sm:grid-cols-2", className)}>
      {items.map((item) => (
        <li key={item.slug}>
          <Link
            href={item.href}
            className="group flex h-full flex-col rounded-xl border border-border/70 bg-card/50 p-5 transition-colors hover:border-primary/40"
          >
            {item.meta ? (
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">{item.meta}</p>
            ) : null}
            <h2 className="mt-1 text-base font-semibold text-foreground group-hover:text-primary">
              {item.title}
            </h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">
              {item.description}
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">
              Open
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
