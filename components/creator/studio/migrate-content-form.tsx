"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  MIGRATION_CONTENT_TYPE_LABELS,
  MIGRATION_STATUS_LABELS,
  buildMigrationNote,
  type MigrationContentType,
  type MigrationRequest,
} from "@/lib/types/youtube-migration"
import { MIGRATION_REQUESTS_STUDIO_URL } from "@/lib/youtube-migration-storage"
import { STUDIO_HOME } from "@/lib/studio-routes"
import { isValidYoutubeUrl } from "@/lib/youtube-migration-validation"
import { MigrationRequestsTable } from "@/components/creator/studio/migration-requests-table"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { cn } from "@/lib/utils"

const CONTENT_TYPES: MigrationContentType[] = [
  "music_videos",
  "audio_tracks",
  "music_videos_and_audio",
  "other",
]

const NEXT_STEPS = [
  { title: "Submit request", description: "Share your channel URL and content details." },
  { title: "Team review", description: "We verify your content and rights." },
  { title: "Content goes live", description: "Approved content published on Hiffi." },
  { title: "You are notified", description: "Status updates sent to your account." },
] as const

const STATUS_LEGEND = Object.keys(MIGRATION_STATUS_LABELS) as Array<
  keyof typeof MIGRATION_STATUS_LABELS
>

function statusBadgeClass(status: MigrationRequest["status"]): string {
  if (status === "completed") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
  if (status === "rejected") return "bg-red-500/15 text-red-700 dark:text-red-400"
  if (status === "approved") return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
  if (status === "pending") return "bg-muted text-muted-foreground"
  return "bg-blue-500/15 text-blue-700 dark:text-blue-400"
}

export function MigrateContentForm() {
  const router = useRouter()
  const { toast } = useToast()
  const { userData } = useAuth()

  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [contentType, setContentType] = useState<MigrationContentType>("music_videos")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [ownershipConfirmed, setOwnershipConfirmed] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)

  const [migrationRequests, setMigrationRequests] = useState<MigrationRequest[]>([])
  const [loadingRequests, setLoadingRequests] = useState(true)

  const fetchRequests = useCallback(async () => {
    try {
      const request = await apiClient.getMyMigrationStatus()
      setMigrationRequests(request ? [request] : [])
    } catch {
      setMigrationRequests([])
    } finally {
      setLoadingRequests(false)
    }
  }, [])

  useEffect(() => {
    void fetchRequests()
  }, [fetchRequests])

  const handleSubmit = () => {
    const nextErrors: Record<string, string> = {}
    const trimmedUrl = youtubeUrl.trim()

    if (!trimmedUrl) nextErrors.youtubeUrl = "Enter a YouTube channel or playlist URL."
    else if (!isValidYoutubeUrl(trimmedUrl)) {
      nextErrors.youtubeUrl = "Enter a supported YouTube channel or playlist URL."
    }

    if (!ownershipConfirmed) nextErrors.ownershipConfirmed = "Confirm ownership to continue."

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setConfirmDialogOpen(true)
  }

  const handleConfirmedSubmit = async () => {
    setConfirmDialogOpen(false)
    setIsSubmitting(true)
    const trimmedUrl = youtubeUrl.trim()
    const username = (userData?.username as string | undefined) || undefined
    try {
      await apiClient.createMigrationRequest({
        platform: "youtube",
        channel_url: trimmedUrl,
        artist_name: username,
        note: buildMigrationNote(contentType),
      })

      toast({
        title: "Migration request submitted",
        description: "Track progress in Migration Requests on Hiffi Studio.",
      })
      router.push(MIGRATION_REQUESTS_STUDIO_URL)
    } catch (err) {
      const apiErr = err as { message?: string; status?: number }
      const msg =
        apiErr?.message ||
        (err instanceof Error ? err.message : null) ||
        "Failed to submit request. Please try again."

      if (apiErr?.status === 409) {
        toast({
          title: "Request already exists",
          description: msg,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Submission failed",
          description: msg,
          variant: "destructive",
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <nav aria-label="Breadcrumb" className="text-[13px] text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href={STUDIO_HOME} className="transition-colors hover:text-foreground">
              Creator Studio
            </Link>
          </li>
          <li aria-hidden className="text-muted-foreground/60">
            /
          </li>
          <li>Tools</li>
          <li aria-hidden className="text-muted-foreground/60">
            /
          </li>
          <li className="font-medium text-foreground">Migrate Content</li>
        </ol>
      </nav>

      <header className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">
          Migrate Content
        </h1>
        <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
          Import your existing YouTube content to Hiffi. Our team reviews every request and verifies
          ownership before migration begins.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-8">
          <section
            aria-labelledby="migration-details-title"
            className="rounded-xl border border-border/80 bg-card p-5 shadow-sm sm:rounded-2xl sm:p-7"
          >
            <h2
              id="migration-details-title"
              className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground"
            >
              Migration details
            </h2>

            <div className="mt-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="migration-youtube-url">
                  YouTube Channel / Playlist URL <span className="text-primary">*</span>
                </Label>
                <Input
                  id="migration-youtube-url"
                  value={youtubeUrl}
                  onChange={(e) => {
                    setYoutubeUrl(e.target.value)
                    setErrors((prev) => {
                      const next = { ...prev }
                      delete next.youtubeUrl
                      return next
                    })
                  }}
                  placeholder="https://youtube.com/channel/... or playlist URL"
                  autoComplete="off"
                />
                <p className="text-[12px] text-muted-foreground">
                  Accepts channel URLs (@handle, /channel/…) or playlist URLs.
                </p>
                {errors.youtubeUrl ? (
                  <p className="text-sm text-destructive">{errors.youtubeUrl}</p>
                ) : null}
              </div>

              <fieldset className="space-y-3">
                <legend className="text-sm font-medium leading-none">
                  Content Type <span className="text-primary">*</span>
                </legend>
                <div className="flex flex-wrap gap-2 pt-1">
                  {CONTENT_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setContentType(type)}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors",
                        contentType === type
                          ? "border-primary bg-primary/[0.06] text-primary"
                          : "border-border text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                      )}
                    >
                      {MIGRATION_CONTENT_TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="space-y-3">
                <p className="text-sm font-medium leading-none">
                  Ownership Confirmation <span className="text-primary">*</span>
                </p>
                <p className="text-[12px] text-muted-foreground">
                  By submitting, you attest that you own or control the rights to the content at the
                  URL above. Our team may contact you to verify ownership before approving the
                  request.
                </p>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/80 p-4">
                  <Checkbox
                    checked={ownershipConfirmed}
                    onCheckedChange={(checked) => {
                      setOwnershipConfirmed(checked === true)
                      setErrors((prev) => {
                        const next = { ...prev }
                        delete next.ownershipConfirmed
                        return next
                      })
                    }}
                    className="mt-0.5"
                  />
                  <span className="text-[13px] leading-relaxed text-muted-foreground">
                    I confirm that I own or have the necessary rights to migrate and publish this
                    content on Hiffi.
                  </span>
                </label>
                {errors.ownershipConfirmed ? (
                  <p className="text-sm text-destructive">{errors.ownershipConfirmed}</p>
                ) : null}
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 border-t border-border/60 pt-6 sm:flex-row sm:items-center">
              <Button
                type="button"
                size="lg"
                className="h-11 rounded-xl text-sm font-semibold sm:min-w-[220px]"
                data-analytics-name="creator-studio-start-migration-submit-button"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting…" : "Submit migration request"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-11 rounded-xl text-sm font-semibold"
                asChild
              >
                <Link href={STUDIO_HOME}>Cancel</Link>
              </Button>
            </div>

            <p className="mt-4 text-[12px] text-muted-foreground">
              After submission you can track status in Migration Requests.
            </p>
          </section>
        </div>

        <aside className="space-y-4 lg:col-span-4">
          <section className="rounded-xl border border-border/80 bg-card p-5 shadow-sm sm:rounded-2xl sm:p-6">
            <h2 className="text-sm font-semibold text-foreground">What happens next?</h2>
            <ol className="mt-5 space-y-5">
              {NEXT_STEPS.map((step, index) => (
                <li key={step.title} className="flex gap-3">
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold",
                      index === 0
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-[13px] font-semibold text-foreground">{step.title}</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-5 border-t border-border/60 pt-4 text-[12px] leading-relaxed text-muted-foreground">
              Processing takes 3 to 5 business days. Track status in Migration Requests on Hiffi
              Studio.
            </p>
          </section>

          <section className="rounded-xl border border-border/80 bg-card p-5 shadow-sm sm:rounded-2xl sm:p-6">
            <h2 className="text-sm font-semibold text-foreground">Request statuses</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {STATUS_LEGEND.map((status) => (
                <span
                  key={status}
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                    statusBadgeClass(status),
                  )}
                >
                  {MIGRATION_STATUS_LABELS[status]}
                </span>
              ))}
            </div>
            <p className="mt-4 text-[12px] leading-relaxed text-muted-foreground">
              Rejected requests include a reason note.
            </p>
          </section>
        </aside>
      </div>

      {!loadingRequests && <MigrationRequestsTable requests={migrationRequests} />}

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit migration request?</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  You are about to submit a request to migrate content from{" "}
                  <span className="font-medium text-foreground break-all">
                    {youtubeUrl.trim()}
                  </span>{" "}
                  to Hiffi.
                </p>
                <p>
                  Once submitted, this request cannot be cancelled or modified until the migration
                  process is complete. Our team will review it and reach out if anything needs
                  clarification.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
              disabled={isSubmitting}
            >
              Go back
            </Button>
            <Button onClick={() => void handleConfirmedSubmit()} disabled={isSubmitting}>
              {isSubmitting ? "Submitting…" : "Yes, submit request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
