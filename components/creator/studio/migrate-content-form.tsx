"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  MIGRATION_CONTENT_TYPE_LABELS,
  MIGRATION_STATUS_LABELS,
  type MigrationContentType,
  type MigrationRequestStatus,
  type YoutubeMigrationRequest,
} from "@/lib/types/youtube-migration"
import { appendMigrationRequest, loadMigrationRequests, MIGRATION_REQUESTS_STUDIO_URL } from "@/lib/youtube-migration-storage"
import { isValidYoutubeUrl } from "@/lib/youtube-migration-validation"
import { verifyYoutubeChannelOwnership } from "@/lib/youtube-channel-verification"
import { MigrationRequestsTable } from "@/components/creator/studio/migration-requests-table"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const CONTENT_TYPES: MigrationContentType[] = [
  "music_videos",
  "audio_tracks",
  "music_videos_and_audio",
  "other",
]

const NEXT_STEPS = [
  { title: "Submit request", description: "Verify channel ownership and submit your request." },
  { title: "Team review", description: "We verify your content and rights." },
  { title: "Content goes live", description: "Approved content published on Hiffi." },
  { title: "You are notified", description: "Status updates sent to your account." },
] as const

const STATUS_LEGEND: MigrationRequestStatus[] = [
  "submitted",
  "under_review",
  "processing",
  "completed",
  "rejected",
]

function statusBadgeClass(status: MigrationRequestStatus): string {
  if (status === "completed") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
  if (status === "rejected") return "bg-red-500/15 text-red-700 dark:text-red-400"
  if (status === "processing") return "bg-amber-500/15 text-amber-700 dark:text-amber-400"
  if (status === "submitted") return "bg-muted text-muted-foreground"
  return "bg-blue-500/15 text-blue-700 dark:text-blue-400"
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

type MigrateContentFormProps = {
  defaultArtistName?: string | null
}

export function MigrateContentForm({ defaultArtistName }: MigrateContentFormProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [artistName, setArtistName] = useState(defaultArtistName ?? "")
  const [contentType, setContentType] = useState<MigrationContentType>("music_videos")
  const [googleVerified, setGoogleVerified] = useState(false)
  const [verifiedChannelId, setVerifiedChannelId] = useState<string | null>(null)
  const [verifiedGoogleEmail, setVerifiedGoogleEmail] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [ownershipConfirmed, setOwnershipConfirmed] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [migrationRequests, setMigrationRequests] = useState<YoutubeMigrationRequest[]>([])

  useEffect(() => {
    setMigrationRequests(loadMigrationRequests())
  }, [])

  const resetVerification = () => {
    setGoogleVerified(false)
    setVerifiedChannelId(null)
    setVerifiedGoogleEmail(null)
  }

  const handleGoogleVerify = async () => {
    const trimmedUrl = youtubeUrl.trim()
    if (!trimmedUrl) {
      setErrors((prev) => ({
        ...prev,
        youtubeUrl: "Enter your YouTube channel or playlist URL before verifying.",
      }))
      return
    }
    if (!isValidYoutubeUrl(trimmedUrl)) {
      setErrors((prev) => ({
        ...prev,
        youtubeUrl: "Enter a supported YouTube channel or playlist URL.",
      }))
      return
    }

    setIsVerifying(true)
    setErrors((prev) => {
      const next = { ...prev }
      delete next.googleVerified
      return next
    })

    try {
      const result = await verifyYoutubeChannelOwnership(trimmedUrl)
      if (!result.verified) {
        if (result.reason === "invalid_url" || result.reason === "channel_not_found") {
          setErrors((prev) => ({ ...prev, youtubeUrl: result.message }))
        } else {
          setErrors((prev) => ({ ...prev, googleVerified: result.message }))
        }
        resetVerification()
        if (result.reason !== "auth_cancelled") {
          toast({
            title: "Verification failed",
            description: result.message,
            variant: "destructive",
          })
        }
        return
      }

      setGoogleVerified(true)
      setVerifiedChannelId(result.channelId)
      setVerifiedGoogleEmail(result.googleEmail)
      toast({
        title: "Channel verified",
        description: result.googleEmail
          ? `${result.googleEmail} manages this YouTube channel.`
          : "Your Google account manages this YouTube channel.",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleSubmit = () => {
    const nextErrors: Record<string, string> = {}
    const trimmedUrl = youtubeUrl.trim()
    const trimmedArtist = artistName.trim()

    if (!trimmedUrl) nextErrors.youtubeUrl = "Enter a YouTube channel or playlist URL."
    else if (!isValidYoutubeUrl(trimmedUrl)) {
      nextErrors.youtubeUrl = "Enter a supported YouTube channel or playlist URL."
    }

    if (!trimmedArtist) nextErrors.artistName = "Enter your artist or creator name."
    if (!googleVerified) nextErrors.googleVerified = "Verify ownership via Google before submitting."
    if (!ownershipConfirmed) nextErrors.ownershipConfirmed = "Confirm ownership to continue."

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const request: YoutubeMigrationRequest = {
      id: crypto.randomUUID(),
      submittedAt: new Date().toISOString(),
      youtubeUrl: trimmedUrl,
      artistName: trimmedArtist,
      contentType,
      status: "submitted",
      googleVerified: true,
      verifiedChannelId: verifiedChannelId ?? undefined,
      verifiedGoogleEmail: verifiedGoogleEmail ?? undefined,
    }

    appendMigrationRequest(request)
    toast({
      title: "Migration request submitted",
      description: "Track progress in Migration Requests on Hiffi Studio.",
    })
    router.push(MIGRATION_REQUESTS_STUDIO_URL)
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <nav aria-label="Breadcrumb" className="text-[13px] text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/upload" className="transition-colors hover:text-foreground">
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

      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">
            Migrate Content
          </h1>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
            Import your existing YouTube content to Hiffi. Our team reviews every request.
          </p>
        </div>
        {migrationRequests.length > 0 ? (
          <Link
            href={MIGRATION_REQUESTS_STUDIO_URL}
            className="shrink-0 text-[13px] font-medium text-primary underline-offset-4 transition-colors hover:underline"
          >
            View migration requests
          </Link>
        ) : null}
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
                    resetVerification()
                    setErrors((prev) => {
                      const next = { ...prev }
                      delete next.youtubeUrl
                      delete next.googleVerified
                      return next
                    })
                  }}
                  placeholder="https://youtube.com/channel/... or playlist URL"
                  autoComplete="off"
                />
                <p className="text-[12px] text-muted-foreground">
                  Accepts channel URLs (@handle, /channel/…) or playlist URLs. Enter your URL first,
                  then verify with the Google account that manages that channel.
                </p>
                {errors.youtubeUrl ? (
                  <p className="text-sm text-destructive">{errors.youtubeUrl}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="migration-artist-name">
                  Artist / Creator Name <span className="text-primary">*</span>
                </Label>
                <Input
                  id="migration-artist-name"
                  value={artistName}
                  onChange={(e) => {
                    setArtistName(e.target.value)
                    setErrors((prev) => {
                      const next = { ...prev }
                      delete next.artistName
                      return next
                    })
                  }}
                  placeholder="Your artist or creator name"
                  autoComplete="name"
                />
                {errors.artistName ? (
                  <p className="text-sm text-destructive">{errors.artistName}</p>
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
                <div>
                  <p className="text-sm font-medium leading-none">
                    Ownership Verification <span className="text-primary">*</span>
                  </p>
                  <p className="mt-1.5 text-[12px] text-muted-foreground">
                    Sign in with the Google account that manages this YouTube channel.
                  </p>
                </div>

                <div className="rounded-xl border border-border/80 bg-muted/20 p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/80 bg-background">
                        <GoogleIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">Verify with Google</p>
                        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                          Grants read-only YouTube access to confirm you manage the channel above.
                        </p>
                        {verifiedGoogleEmail ? (
                          <p className="mt-2 text-[12px] text-foreground/80">{verifiedGoogleEmail}</p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 text-[12px] font-medium",
                          googleVerified ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
                        )}
                      >
                        <span
                          className={cn(
                            "size-2 rounded-full",
                            googleVerified ? "bg-emerald-500" : "bg-muted-foreground/50",
                          )}
                          aria-hidden
                        />
                        {googleVerified ? "Verified" : "Not verified"}
                      </span>
                      {!googleVerified ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-9 rounded-lg text-[13px]"
                          onClick={() => void handleGoogleVerify()}
                          disabled={isVerifying}
                        >
                          {isVerifying ? "Verifying…" : "Verify"}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
                {errors.googleVerified ? (
                  <p className="text-sm text-destructive">{errors.googleVerified}</p>
                ) : null}
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium leading-none">
                  Ownership Confirmation <span className="text-primary">*</span>
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
              >
                Submit migration request
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-11 rounded-xl text-sm font-semibold"
                asChild
              >
                <Link href="/upload">Cancel</Link>
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

      <MigrationRequestsTable requests={migrationRequests} />
    </div>
  )
}
