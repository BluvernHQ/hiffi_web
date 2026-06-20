"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Video, Youtube } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MigrationRequestsTable } from "@/components/creator/studio/migration-requests-table"
import type { MigrationRequest } from "@/lib/types/youtube-migration"
import { MIGRATION_REQUESTS_SECTION_ID, MIGRATION_REQUESTS_STUDIO_URL } from "@/lib/youtube-migration-storage"
import { apiClient } from "@/lib/api-client"
import { cn } from "@/lib/utils"

type CreatorStudioSelectProps = {
  fileInputRef: React.RefObject<HTMLInputElement | null>
  isDragOver: boolean
  onDragEnter: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
}

const toolCardClass = cn(
  "group flex h-full flex-col rounded-xl border bg-card p-5 shadow-sm",
  "transition-[border-color,box-shadow,transform,background-color] duration-200",
  "hover:border-border hover:shadow-md motion-safe:hover:-translate-y-px",
  "sm:rounded-2xl sm:p-6",
)

export function CreatorStudioSelect({
  fileInputRef,
  isDragOver,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
}: CreatorStudioSelectProps) {
  const searchParams = useSearchParams()
  const migrationSectionRef = useRef<HTMLElement>(null)
  const [migrationRequests, setMigrationRequests] = useState<MigrationRequest[]>([])

  const refreshMigrationRequests = useCallback(async () => {
    try {
      const request = await apiClient.getMyMigrationStatus()
      setMigrationRequests(request ? [request] : [])
    } catch {
      setMigrationRequests([])
    }
  }, [])

  useEffect(() => {
    void refreshMigrationRequests()
  }, [refreshMigrationRequests])

  useEffect(() => {
    const scrollToRequests = () => {
      const shouldScroll =
        searchParams.get("migration") === "submitted" ||
        window.location.hash === `#${MIGRATION_REQUESTS_SECTION_ID}`

      if (!shouldScroll) return

      void refreshMigrationRequests()
      requestAnimationFrame(() => {
        migrationSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      })
    }

    scrollToRequests()
    window.addEventListener("hashchange", scrollToRequests)
    return () => window.removeEventListener("hashchange", scrollToRequests)
  }, [searchParams, refreshMigrationRequests])

  return (
    <>
      <div className="space-y-8 sm:space-y-10">
        <section
          className={cn(
            "flex overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm",
            "transition-[border-color,box-shadow] duration-200 hover:border-border hover:shadow-md",
            "sm:rounded-2xl",
          )}
          aria-labelledby="studio-status-label"
        >
          <div className="hidden w-1 shrink-0 bg-primary/85 lg:block" aria-hidden />
          <div className="relative min-w-0 flex-1 px-5 py-4 sm:px-6 sm:py-5 lg:py-4">
            <div className="absolute bottom-3 left-0 top-3 w-0.5 rounded-full bg-primary lg:hidden" aria-hidden />
            <div className="pl-3 lg:flex lg:items-center lg:justify-between lg:gap-8 lg:pl-0">
              <div className="lg:flex lg:items-baseline lg:gap-3">
                <p
                  id="studio-status-label"
                  className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground"
                >
                  Creator status
                </p>
                <p className="mt-2 text-2xl font-semibold leading-none tracking-tight text-primary lg:mt-0 lg:text-xl">
                  Active
                </p>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground lg:mt-0 lg:max-w-md lg:text-right">
                Your channel is active and ready to publish.
              </p>
            </div>
          </div>
        </section>

        <div>
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Creator tools
          </h2>

          <div className="mt-4 grid gap-4 sm:mt-5 sm:gap-5 lg:grid-cols-2 lg:gap-6">
            <section
              aria-labelledby="upload-action-title"
              className={cn(
                toolCardClass,
                "border-primary/25 hover:border-primary/40",
                isDragOver && [
                  "border-primary bg-primary/[0.07] shadow-md ring-2 ring-primary/25",
                  "motion-safe:scale-[1.005]",
                ],
              )}
              onDragEnter={onDragEnter}
              onDragLeave={onDragLeave}
              onDragOver={onDragOver}
              onDrop={onDrop}
            >
              <div className="flex flex-1 flex-col gap-5">
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary transition-colors duration-200 group-hover:bg-primary/[0.14]",
                      isDragOver && "border-primary/40 bg-primary/20",
                    )}
                    aria-hidden
                  >
                    <Video className="size-5" strokeWidth={1.65} />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <h3
                      id="upload-action-title"
                      className="text-[15px] font-semibold tracking-tight text-foreground"
                    >
                      Upload a video
                    </h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                      Share a new release with your audience.
                    </p>
                  </div>
                </div>

                <div className="mt-auto space-y-3">
                  <Button
                    type="button"
                    size="lg"
                    data-analytics-name="creator-studio-upload-new-video-button"
                    className={cn(
                      "h-11 w-full rounded-xl text-sm font-semibold shadow-none motion-safe:active:scale-[0.99]",
                      isDragOver && "ring-2 ring-primary-foreground/25",
                    )}
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Choose a video file to upload"
                  >
                    <Video className="size-4 opacity-95" aria-hidden />
                    {isDragOver ? "Drop video here" : "Upload new video"}
                  </Button>

                  <p
                    className={cn(
                      "text-[11px] leading-relaxed text-muted-foreground sm:text-xs",
                      isDragOver && "font-medium text-primary",
                    )}
                  >
                    {isDragOver
                      ? "Release to start uploading."
                      : "Tip: drag and drop a file into this card."}
                  </p>
                </div>
              </div>
            </section>

            <section
              aria-labelledby="migrate-action-title"
              className={cn(toolCardClass, "border-border/80")}
            >
              <div className="flex flex-1 flex-col gap-5">
                <div className="flex items-start gap-4">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary text-primary-foreground"
                    aria-hidden
                  >
                    <Youtube className="size-5" strokeWidth={1.65} />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <h3
                      id="migrate-action-title"
                      className="text-[15px] font-semibold tracking-tight text-foreground"
                    >
                      Migrate content
                    </h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                      Import YouTube videos and audio tracks to Hiffi.
                    </p>
                  </div>
                </div>

                <div className="mt-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    type="button"
                    size="lg"
                    data-analytics-name="creator-studio-start-migration-button"
                    className="h-11 w-full rounded-xl text-sm font-semibold shadow-none sm:w-auto sm:min-w-[160px]"
                    asChild
                  >
                    <Link href="/upload/migrate">Start migration</Link>
                  </Button>
                  {migrationRequests.length > 0 ? (
                    <Link
                      href={MIGRATION_REQUESTS_STUDIO_URL}
                      className="text-[13px] font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                    >
                      View migration requests
                    </Link>
                  ) : null}
                </div>
              </div>
            </section>
          </div>
        </div>

        <MigrationRequestsTable requests={migrationRequests} sectionRef={migrationSectionRef} />
      </div>
    </>
  )
}
