import { Sparkles, ChevronRight, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export type CuratedPlaylistSummary = {
  playlistId: string
  title: string
  description?: string
  item_count?: number
}

export function CuratedMixSection({
  curatedLoading,
  curatedPlaylists,
  curatedActionLoadingId,
  activeCuratedPlaylistId,
  isAppDownloadPage,
  onCuratedClick,
}: {
  curatedLoading: boolean
  curatedPlaylists: CuratedPlaylistSummary[]
  curatedActionLoadingId: string | null
  activeCuratedPlaylistId: string | null
  isAppDownloadPage: boolean
  onCuratedClick: (p: CuratedPlaylistSummary) => void | Promise<void>
}) {
  if (!curatedLoading && curatedPlaylists.length === 0) return null

  return (
    <div className="pt-4">
      <div
        className={cn(
          "mb-2 px-4 text-xs font-semibold uppercase tracking-wider",
          isAppDownloadPage ? "text-black/55" : "text-muted-foreground",
        )}
      >
        Curated Mix
      </div>

      {curatedLoading ? (
        <div className="space-y-1 px-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[3.25rem] rounded-xl border border-border/60 bg-muted/40 animate-shimmer" />
          ))}
        </div>
      ) : (
        <div className="space-y-1.5 px-4">
          {curatedPlaylists.map((p) => {
            const isLoading = curatedActionLoadingId === p.playlistId
            const isSelected = activeCuratedPlaylistId === p.playlistId
            return (
              <button
                key={p.playlistId}
                type="button"
                onClick={() => void onCuratedClick(p)}
                className={cn(
                  "group relative flex w-full items-center justify-between gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all duration-200",
                  isAppDownloadPage
                    ? cn(
                        "border border-white/10 bg-zinc-950 shadow-sm",
                        "hover:border-white/20 hover:bg-zinc-900 hover:shadow-md",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f3f0e8]",
                        isSelected && "border-primary/45 bg-zinc-900 shadow-md ring-1 ring-primary/20",
                      )
                    : cn(
                        "border-border/80 bg-background/95 hover:border-border hover:bg-muted/45 hover:shadow-sm",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        isSelected && "border-primary/35 bg-primary/[0.05]",
                      ),
                  isLoading && "pointer-events-none opacity-70",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute bottom-1.5 left-0 top-1.5 w-px rounded-full bg-transparent transition-colors",
                    isSelected ? "bg-primary/70" : isAppDownloadPage ? "group-hover:bg-white/25" : "group-hover:bg-border",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div
                    className={cn(
                      "relative truncate pl-5 text-sm font-semibold tracking-tight",
                      isAppDownloadPage ? "text-white/90" : "text-foreground",
                    )}
                  >
                    <Sparkles
                      aria-hidden="true"
                      className={cn(
                        "absolute left-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-primary/30 transition-colors",
                        isSelected && "text-primary/55",
                      )}
                    />
                    {p.title}
                  </div>
                  {p.description ? (
                    <div
                      className={cn(
                        "mt-0.5 line-clamp-1 text-[11px] leading-4",
                        isAppDownloadPage ? "text-white/65" : "text-muted-foreground/90",
                      )}
                    >
                      {p.description}
                    </div>
                  ) : null}
                </div>
                <div
                  className={cn(
                    "flex-shrink-0 text-muted-foreground/80 transition-all duration-200",
                    !isLoading && "group-hover:text-foreground group-hover:translate-x-0.5",
                    isAppDownloadPage && !isLoading && "text-white/55 group-hover:text-white/80",
                    isSelected && "text-primary",
                  )}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

