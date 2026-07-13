import { MapPin } from "lucide-react"
import type { AtlantaTimelineItem } from "@/lib/atlanta/types"
import { cn } from "@/lib/utils"

type AtlantaProfileSectionsProps = {
  bio: string
  notable: string[]
  neighborhood?: string
  address?: string
  timeline?: AtlantaTimelineItem[]
  className?: string
}

export function AtlantaProfileSections({
  bio,
  notable,
  neighborhood,
  address,
  timeline,
  className,
}: AtlantaProfileSectionsProps) {
  return (
    <div className={cn("space-y-8", className)}>
      {(neighborhood || address) && (
        <p className="inline-flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          <span>
            {neighborhood}
            {neighborhood && address ? " · " : null}
            {address && address !== neighborhood ? address : null}
          </span>
        </p>
      )}

      <section aria-labelledby="atlanta-profile-bio">
        <h2 id="atlanta-profile-bio" className="text-lg font-bold tracking-tight text-foreground">
          About
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {bio}
        </p>
      </section>

      {notable.length > 0 ? (
        <section aria-labelledby="atlanta-profile-notable">
          <h2 id="atlanta-profile-notable" className="text-lg font-bold tracking-tight text-foreground">
            Notable
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {notable.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {timeline && timeline.length > 0 ? (
        <section aria-labelledby="atlanta-profile-timeline">
          <h2 id="atlanta-profile-timeline" className="text-lg font-bold tracking-tight text-foreground">
            Timeline
          </h2>
          <ol className="mt-4 space-y-3 border-l border-border/80 pl-4">
            {timeline.map((item) => (
              <li key={`${item.year}-${item.label}`} className="relative">
                <span
                  className="absolute -left-[1.28rem] top-1.5 h-2.5 w-2.5 rounded-full bg-primary"
                  aria-hidden
                />
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">{item.year}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{item.label}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  )
}
