"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Upload, X, CheckCircle2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

export type UploadJobStatus =
  | "preparing"
  | "uploading"
  | "thumbnail"
  | "finalizing"
  | "done"
  | "error"

export type UploadJob = {
  id: string
  title: string
  progress: number
  status: UploadJobStatus
  errorMessage?: string
  /** Set when upload + ack succeed — same as API `bridge_id` (watch URL). */
  videoId?: string
}

type StartUploadParams = {
  file: File
  title: string
  description: string
  tags: string
  thumbnail: File | null
}

type VideoUploadQueueContextValue = {
  jobs: UploadJob[]
  /** Starts upload in background; returns job id immediately. */
  startUpload: (params: StartUploadParams) => string
  dismissJob: (id: string) => void
  /** Aborts in-flight PUT (if any) and removes the job from the queue. */
  cancelUpload: (id: string) => void
  /** True while any job is not terminal (done/error cleared). */
  isUploadRunning: boolean
}

const VideoUploadQueueContext = createContext<VideoUploadQueueContextValue | null>(null)

function statusLabel(job: UploadJob): string {
  switch (job.status) {
    case "preparing":
      return "Preparing…"
    case "uploading":
      return "Uploading video…"
    case "thumbnail":
      return "Thumbnail…"
    case "finalizing":
      return "Finishing…"
    case "done":
      return "Processing on Hiffi"
    case "error":
      return job.errorMessage || "Upload failed"
    default:
      return ""
  }
}

function GlobalUploadBar() {
  const ctx = useContext(VideoUploadQueueContext)
  if (!ctx || ctx.jobs.length === 0) return null

  const { jobs, dismissJob, cancelUpload } = ctx

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex justify-end px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 sm:px-4"
      aria-live="polite"
    >
      <div className="flex min-w-0 max-w-md flex-col gap-1.5">
        {jobs.map((job) => {
          const active = job.status !== "done" && job.status !== "error"
          return (
            <div
              key={job.id}
              className={cn(
                "pointer-events-auto rounded-lg border border-border bg-card shadow-md",
                "ring-1 ring-black/5 dark:ring-white/10",
              )}
            >
              <div className="flex items-center gap-2 px-2.5 py-1.5 sm:gap-2.5 sm:px-3 sm:py-2">
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-md sm:h-8 sm:w-8",
                    job.status === "done" && "bg-green-500/15 text-green-600 dark:text-green-400",
                    job.status === "error" && "bg-destructive/15 text-destructive",
                    active && "bg-primary/10 text-primary",
                  )}
                >
                  {job.status === "done" ? (
                    <CheckCircle2 className="size-3.5 sm:size-4" />
                  ) : job.status === "error" ? (
                    <AlertCircle className="size-3.5 sm:size-4" />
                  ) : (
                    <Upload className="size-3.5 sm:size-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium leading-tight text-foreground">
                    {job.title}
                  </p>
                  {active ? (
                    <div className="mt-1 flex items-center gap-2">
                      <Progress value={job.progress} className="h-0.5 flex-1" />
                      <span className="w-8 shrink-0 text-right text-[10px] tabular-nums text-muted-foreground">
                        {job.progress}%
                      </span>
                    </div>
                  ) : (
                    <p className="mt-0.5 truncate text-[10px] leading-snug text-muted-foreground">
                      {statusLabel(job)}
                    </p>
                  )}
                </div>
                {active ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 shrink-0 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => cancelUpload(job.id)}
                  >
                    Cancel
                  </Button>
                ) : (
                  <div className="flex shrink-0 items-center gap-1">
                    {job.status === "done" && job.videoId ? (
                      <Button type="button" variant="default" size="sm" className="h-7 px-2 text-xs" asChild>
                        <Link href={`/watch/${encodeURIComponent(job.videoId)}`}>Watch Video</Link>
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => dismissJob(job.id)}
                      aria-label="Dismiss"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function updateJob(
  jobs: UploadJob[],
  id: string,
  patch: Partial<Pick<UploadJob, "progress" | "status" | "errorMessage" | "videoId">>,
): UploadJob[] {
  return jobs.map((j) => (j.id === id ? { ...j, ...patch } : j))
}

export function VideoUploadQueueProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast()
  const [jobs, setJobs] = useState<UploadJob[]>([])
  const cancelledJobIdsRef = useRef(new Set<string>())
  const activeXhrByJobRef = useRef(new Map<string, XMLHttpRequest>())

  const dismissJob = useCallback((id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id))
  }, [])

  const cancelUpload = useCallback(
    (id: string) => {
      cancelledJobIdsRef.current.add(id)
      activeXhrByJobRef.current.get(id)?.abort()
      activeXhrByJobRef.current.delete(id)
      setJobs((prev) => prev.filter((j) => j.id !== id))
      toast({ title: "Upload cancelled" })
    },
    [toast],
  )

  const startUpload = useCallback(
    (params: StartUploadParams) => {
      const id =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
      const { file, title, description, tags, thumbnail } = params

      setJobs((prev) => [
        ...prev,
        { id, title, progress: 0, status: "preparing" },
      ])

      void (async () => {
        const isCancelled = () => cancelledJobIdsRef.current.has(id)
        const clearCancelled = () => {
          cancelledJobIdsRef.current.delete(id)
          activeXhrByJobRef.current.delete(id)
        }

        try {
          const tagsArray = tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)

          const bridgeResponse = await apiClient.uploadVideo({
            video_title: title,
            video_description: description,
            video_tags: tagsArray,
          })

          if (isCancelled()) {
            clearCancelled()
            return
          }

          if (!bridgeResponse.bridge_id?.trim()) {
            throw new Error("Failed to get bridge ID from upload response.")
          }
          if (!bridgeResponse.gateway_url?.trim()) {
            throw new Error("Failed to get upload URL from upload response.")
          }

          setJobs((prev) =>
            updateJob(prev, id, { status: "uploading", progress: 5 }),
          )

          await apiClient.uploadFile(
            bridgeResponse.gateway_url,
            file,
            (p) => {
              const overall = Math.round(5 + p * 0.75)
              setJobs((prev) => updateJob(prev, id, { progress: overall }))
            },
            (xhr) => {
              activeXhrByJobRef.current.set(id, xhr)
            },
          )
          activeXhrByJobRef.current.delete(id)

          if (isCancelled()) {
            clearCancelled()
            return
          }

          setJobs((prev) => updateJob(prev, id, { progress: 80 }))

          if (thumbnail && bridgeResponse.gateway_url_thumbnail) {
            setJobs((prev) => updateJob(prev, id, { status: "thumbnail" }))
            try {
              await apiClient.uploadFile(
                bridgeResponse.gateway_url_thumbnail,
                thumbnail,
                (p) => {
                  const overall = Math.round(80 + p * 0.15)
                  setJobs((prev) => updateJob(prev, id, { progress: overall }))
                },
                (xhr) => {
                  activeXhrByJobRef.current.set(id, xhr)
                },
              )
            } catch (thumbErr) {
              if (isCancelled()) {
                clearCancelled()
                return
              }
              console.error("[Upload] Thumbnail upload failed:", thumbErr)
              toast({
                title: "Warning",
                description:
                  "Video uploaded but thumbnail upload failed. You can update the thumbnail later.",
              })
            }
            activeXhrByJobRef.current.delete(id)
          }

          if (isCancelled()) {
            clearCancelled()
            return
          }

          setJobs((prev) =>
            updateJob(prev, id, { status: "finalizing", progress: 95 }),
          )

          await apiClient.acknowledgeUpload(bridgeResponse.bridge_id)

          if (isCancelled()) {
            clearCancelled()
            return
          }

          const videoId = bridgeResponse.bridge_id.trim()

          setJobs((prev) =>
            updateJob(prev, id, {
              status: "done",
              progress: 100,
              videoId: videoId || undefined,
            }),
          )

          toast({
            title: "Upload complete",
            description: "Your video is processing. Open it with Watch Video below or on the upload page.",
          })

          // Give time to tap Watch Video before auto-dismiss
          window.setTimeout(() => {
            setJobs((prev) => prev.filter((j) => j.id !== id))
          }, 60000)
        } catch (error) {
          if (isCancelled()) {
            clearCancelled()
            return
          }
          activeXhrByJobRef.current.delete(id)
          console.error("[hiffi] Background upload failed:", error)
          const errorMessage =
            error instanceof Error ? error.message : "Upload failed"
          setJobs((prev) =>
            updateJob(prev, id, {
              status: "error",
              errorMessage:
                errorMessage.length > 120
                  ? `${errorMessage.slice(0, 120)}…`
                  : errorMessage,
              progress: 0,
            }),
          )
          toast({
            title: "Upload failed",
            description:
              errorMessage.length > 100
                ? `${errorMessage.slice(0, 100)}…`
                : errorMessage,
            variant: "destructive",
          })
        }
      })()

      return id
    },
    [toast],
  )

  const isUploadRunning = useMemo(
    () =>
      jobs.some(
        (j) =>
          j.status === "preparing" ||
          j.status === "uploading" ||
          j.status === "thumbnail" ||
          j.status === "finalizing",
      ),
    [jobs],
  )

  const value = useMemo(
    () => ({
      jobs,
      startUpload,
      dismissJob,
      cancelUpload,
      isUploadRunning,
    }),
    [jobs, startUpload, dismissJob, cancelUpload, isUploadRunning],
  )

  return (
    <VideoUploadQueueContext.Provider value={value}>
      {children}
      <GlobalUploadBar />
    </VideoUploadQueueContext.Provider>
  )
}

export function useVideoUploadQueue() {
  const ctx = useContext(VideoUploadQueueContext)
  if (!ctx) {
    throw new Error("useVideoUploadQueue must be used within VideoUploadQueueProvider")
  }
  return ctx
}
