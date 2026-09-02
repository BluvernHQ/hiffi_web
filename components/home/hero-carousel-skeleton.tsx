import { cn } from "@/lib/utils"

/**
 * Placeholder that matches HeroCarousel stage proportions so curated load
 * doesn't pop the player in after first paint.
 */
export function HeroCarouselSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-xl bg-zinc-900 sm:rounded-2xl",
        "ring-1 ring-black/10 shadow-[0_20px_50px_-28px_rgba(0,0,0,0.55)]",
        "aspect-[16/9] max-h-[200px] sm:max-h-[220px] md:aspect-[21/9] md:max-h-[min(46svh,460px)]",
        className,
      )}
      aria-hidden
      aria-busy="true"
    >
      <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-800" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent md:w-[68%]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      {/* Top-right action placeholders */}
      <div className="absolute right-2.5 top-2.5 flex gap-1.5 md:right-5 md:top-5 md:gap-3">
        <div className="size-8 animate-pulse rounded-full bg-white/10 md:size-10" />
        <div className="size-8 animate-pulse rounded-full bg-white/10 md:size-10" />
        <div className="hidden size-10 animate-pulse rounded-full bg-white/10 md:block" />
      </div>

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 px-3 pb-2.5 pt-10 md:gap-4 md:px-4 md:pb-6 md:pl-[5.5rem] lg:pb-7 lg:pl-24 lg:pr-6">
        <div className="min-w-0 flex-1 space-y-2 md:max-w-[min(48%,26rem)] lg:max-w-[38%]">
          <div className="hidden h-2.5 w-16 animate-pulse rounded bg-white/15 md:block" />
          <div className="h-4 w-[85%] max-w-sm animate-pulse rounded bg-white/20 sm:h-5 md:h-8 md:w-[90%]" />
          <div className="flex items-center gap-2">
            <div className="size-6 animate-pulse rounded-full bg-white/15 md:size-10" />
            <div className="h-3 w-24 animate-pulse rounded bg-white/15 md:h-3.5 md:w-32" />
          </div>
          <div className="h-8 w-20 animate-pulse rounded-md bg-white/20 md:mt-2 md:h-10 md:w-28 md:rounded-lg" />
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <div className="flex items-center gap-1 md:gap-0">
            <div className="size-7 animate-pulse rounded-full bg-white/10 md:hidden" />
            <div className="flex gap-1.5 md:gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[16/10] w-[3.35rem] animate-pulse rounded-[5px] bg-white/15 sm:w-[3.75rem] md:w-[4.75rem] md:rounded-[6px] lg:w-[5.5rem]"
                />
              ))}
            </div>
            <div className="size-7 animate-pulse rounded-full bg-white/10 md:hidden" />
          </div>
          <div className="h-2.5 w-10 animate-pulse self-center rounded bg-white/10 md:self-end" />
        </div>
      </div>
    </div>
  )
}
