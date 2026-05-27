import type { ReactNode } from "react"
import { Video, TrendingUp, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

const featureTile = cn(
  "rounded-xl border border-border/80 bg-muted/30 p-5 shadow-sm",
  "transition-[border-color,background-color,box-shadow,transform] duration-200",
  "hover:border-border hover:bg-muted/40 hover:shadow-md",
  "motion-safe:hover:-translate-y-px",
  "dark:bg-card/60 dark:hover:bg-card/80",
  "sm:rounded-2xl sm:p-6",
  "lg:col-span-4",
)

const featureIconShell =
  "mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary sm:h-11 sm:w-11"

type BecomeCreatorMarketingProps = {
  /** Client island: sign-in, become creator, or redirect UI */
  cta: ReactNode
}

/**
 * Static creator-apply marketing shell — server-rendered for SEO and slow connections.
 */
export function BecomeCreatorMarketing({ cta }: BecomeCreatorMarketingProps) {
  return (
    <div
      className={cn(
        "min-h-[calc(100vh-4rem)] w-full antialiased selection:bg-primary/20",
        "bg-zinc-100 text-foreground",
        "dark:bg-zinc-900",
      )}
    >
      <main
        className={cn(
          "mx-auto w-full pb-14 pt-6",
          "max-w-lg px-4",
          "sm:max-w-xl sm:px-5 sm:pt-8 sm:pb-16",
          "lg:max-w-5xl lg:px-10 lg:pt-10",
        )}
      >
        <header className="mb-6 text-left sm:mb-8 lg:mb-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Creator
          </p>
          <h1
            id="become-creator-heading"
            className="mt-1.5 text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-2xl"
          >
            Become a creator
          </h1>
          <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
            Unlock uploads and Hiffi Studio when you’re ready to publish.
          </p>
        </header>

        <section
          className={cn(
            "group mb-5 rounded-xl border border-primary/25 bg-card p-5 shadow-sm",
            "transition-[border-color,box-shadow,transform] duration-200",
            "hover:border-primary/40 hover:shadow-md",
            "motion-safe:hover:-translate-y-px",
            "sm:mb-6 sm:rounded-2xl sm:p-7",
            "lg:mb-8 lg:p-8",
          )}
          aria-labelledby="become-creator-cta-title"
        >
          {cta}
        </section>

        <div
          className={cn(
            "grid gap-4",
            "sm:gap-5",
            "lg:grid-cols-12 lg:gap-6",
          )}
        >
          <article className={featureTile}>
            <div className={featureIconShell} aria-hidden>
              <Video className="size-5 sm:size-[22px]" strokeWidth={1.65} />
            </div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground sm:text-[15px]">
              Upload videos
            </h2>
            <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground sm:text-[13px]">
              Share your content, tutorials, music, and more with the Hiffi community.
            </p>
          </article>

          <article className={featureTile}>
            <div className={featureIconShell} aria-hidden>
              <TrendingUp className="size-5 sm:size-[22px]" strokeWidth={1.65} />
            </div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground sm:text-[15px]">
              Grow your audience
            </h2>
            <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground sm:text-[13px]">
              Build followers, get views, and engage through comments and interactions.
            </p>
          </article>

          <article className={featureTile}>
            <div className={featureIconShell} aria-hidden>
              <Zap className="size-5 sm:size-[22px]" strokeWidth={1.65} />
            </div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground sm:text-[15px]">
              Creator features
            </h2>
            <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground sm:text-[13px]">
              Access tools that help you publish and refine your presence on Hiffi.
            </p>
          </article>
        </div>
      </main>
    </div>
  )
}
