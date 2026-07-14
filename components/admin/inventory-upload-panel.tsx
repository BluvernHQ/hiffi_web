"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { FileSpreadsheet, Loader2, Upload, X } from "lucide-react"
import { adminApiClient } from "@/lib/admin-api-client"
import { INVENTORY_UPLOAD_MAX_BYTES, type InventoryUploadResult } from "@/lib/types/inventory"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const ACCEPT = ".csv,.xlsx,.xls"

type UploadPhase = "idle" | "staged" | "uploading" | "processing" | "complete" | "error"

type InventoryUploadPanelProps = {
  onBusyChange?: (busy: boolean) => void
}

function downloadTemplate(): Promise<void> {
  return adminApiClient.adminDownloadInventoryTemplate()
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-muted/30 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value.toLocaleString()}</p>
    </div>
  )
}

export function InventoryUploadPanel({ onBusyChange }: InventoryUploadPanelProps) {
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const [phase, setPhase] = useState<UploadPhase>("idle")
  const [stagedFile, setStagedFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [displayProgress, setDisplayProgress] = useState(0)
  const [result, setResult] = useState<InventoryUploadResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [discardDialogOpen, setDiscardDialogOpen] = useState(false)
  const [cancelUploadDialogOpen, setCancelUploadDialogOpen] = useState(false)
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [pendingHref, setPendingHref] = useState<string | null>(null)
  const [templateLoading, setTemplateLoading] = useState(false)

  const isBusy = phase === "staged" || phase === "uploading" || phase === "processing"
  const isTransferring = phase === "uploading" || phase === "processing"

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    onBusyChange?.(isBusy)
    return () => onBusyChange?.(false)
  }, [isBusy, onBusyChange])

  useEffect(() => {
    if (!isBusy) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [isBusy])

  useEffect(() => {
    if (!isBusy) return

    const onDocClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const anchor = (event.target as HTMLElement).closest("a[href]")
      if (!anchor) return

      const href = anchor.getAttribute("href")
      if (!href || href.startsWith("#")) return
      if (!href.startsWith("/") || href.startsWith("//")) return

      event.preventDefault()
      event.stopPropagation()
      setPendingHref(href)
      setLeaveDialogOpen(true)
    }

    document.addEventListener("click", onDocClick, true)
    return () => document.removeEventListener("click", onDocClick, true)
  }, [isBusy])

  useEffect(() => {
    if (phase !== "processing") return

    setDisplayProgress((prev) => Math.max(prev, 88))
    const interval = window.setInterval(() => {
      setDisplayProgress((prev) => (prev >= 96 ? prev : prev + 0.4))
    }, 400)

    return () => window.clearInterval(interval)
  }, [phase])

  const validateFile = (file: File): string | null => {
    const name = file.name.toLowerCase()
    if (!name.endsWith(".csv") && !name.endsWith(".xlsx") && !name.endsWith(".xls")) {
      return "File must be .csv, .xlsx, or .xls"
    }
    if (file.size > INVENTORY_UPLOAD_MAX_BYTES) {
      return "File exceeds 20 MiB limit"
    }
    return null
  }

  const resetUpload = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setStagedFile(null)
    setPhase("idle")
    setUploadProgress(0)
    setDisplayProgress(0)
    setErrorMessage(null)
    setResult(null)
    if (inputRef.current) inputRef.current.value = ""
  }, [])

  const stageFile = (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      toast({ title: "Invalid file", description: validationError, variant: "destructive" })
      return
    }

    if (isTransferring) {
      setCancelUploadDialogOpen(true)
      return
    }

    if (stagedFile && phase === "staged") {
      setStagedFile(file)
      setResult(null)
      setErrorMessage(null)
      return
    }

    setStagedFile(file)
    setPhase("staged")
    setResult(null)
    setErrorMessage(null)
    setUploadProgress(0)
    setDisplayProgress(0)
  }

  const startImport = async () => {
    if (!stagedFile || isTransferring) return

    const controller = new AbortController()
    abortRef.current = controller

    setPhase("uploading")
    setUploadProgress(0)
    setDisplayProgress(0)
    setErrorMessage(null)
    setResult(null)

    try {
      const data = await adminApiClient.adminUploadInventory(stagedFile, {
        signal: controller.signal,
        onProgress: (progress) => {
          setUploadProgress(progress)
          setDisplayProgress(Math.min(progress * 0.88, 88))
        },
        onUploadComplete: () => {
          setPhase("processing")
        },
      })

      setDisplayProgress(100)
      setPhase("complete")
      setResult(data)
      toast({
        title: "Import complete",
        description: `${data.created} created, ${data.updated} updated, ${data.deleted} deleted.`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed"
      if (message === "Upload cancelled") {
        setPhase("staged")
        setUploadProgress(0)
        setDisplayProgress(0)
        toast({ title: "Import cancelled", description: "The file is still staged — you can restart when ready." })
      } else {
        setPhase("error")
        setErrorMessage(message)
        toast({ title: "Upload failed", description: message, variant: "destructive" })
      }
    } finally {
      abortRef.current = null
    }
  }

  const requestDiscardStaged = () => {
    if (isTransferring) {
      setCancelUploadDialogOpen(true)
      return
    }
    setDiscardDialogOpen(true)
  }

  const confirmDiscardStaged = () => {
    setDiscardDialogOpen(false)
    resetUpload()
  }

  const confirmCancelUpload = () => {
    setCancelUploadDialogOpen(false)
    abortRef.current?.abort()
  }

  const confirmLeave = () => {
    setLeaveDialogOpen(false)
    if (isTransferring) {
      abortRef.current?.abort()
    }
    resetUpload()
    if (pendingHref) {
      window.location.href = pendingHref
    }
    setPendingHref(null)
  }

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0]
    if (file) stageFile(file)
  }

  const statusLabel = (() => {
    if (phase === "uploading") {
      const loaded = stagedFile ? (stagedFile.size * uploadProgress) / 100 : 0
      return `Uploading… ${formatBytes(loaded)} of ${formatBytes(stagedFile?.size ?? 0)}`
    }
    if (phase === "processing") return "Processing rows on server…"
    if (phase === "complete") return "Import complete"
    if (phase === "error") return errorMessage ?? "Import failed"
    return ""
  })()

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-background p-5 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h3 className="text-base font-semibold">Bulk import</h3>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Choose a file, review it, then start the import. Use <strong>CREATE</strong>,{" "}
              <strong>EDIT</strong>, or <strong>DELETE</strong> in the Command column.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={templateLoading}
            onClick={() => {
              setTemplateLoading(true)
              void downloadTemplate()
                .catch((error) => {
                  toast({
                    title: "Template download failed",
                    description: error instanceof Error ? error.message : "Failed to download template",
                    variant: "destructive",
                  })
                })
                .finally(() => setTemplateLoading(false))
            }}
          >
            {templateLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            <span className={templateLoading ? "ml-2" : undefined}>Download template</span>
          </Button>
        </div>

        <div
          className={cn(
            "flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
            dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25",
            isTransferring && "pointer-events-none opacity-60",
          )}
          onDragOver={(event) => {
            event.preventDefault()
            if (!isTransferring) setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragOver(false)
            if (!isTransferring) handleFiles(event.dataTransfer.files)
          }}
        >
          <Upload className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium">Drop a file here or choose from your computer</p>
          <p className="mt-1 text-xs text-muted-foreground">CSV, XLSX, or XLS · max 20 MiB</p>
          <Button
            type="button"
            className="mt-4"
            variant="outline"
            disabled={isTransferring}
            onClick={() => inputRef.current?.click()}
          >
            Choose file
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(event) => handleFiles(event.target.files)}
          />
        </div>

        {stagedFile && phase !== "idle" ? (
          <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{stagedFile.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(stagedFile.size)}</p>
              </div>
              {!isTransferring ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground"
                  onClick={requestDiscardStaged}
                  aria-label="Remove staged file"
                >
                  <X className="h-4 w-4" />
                </Button>
              ) : null}
            </div>

            {isTransferring || phase === "complete" || phase === "error" ? (
              <div className="space-y-2 rounded-lg border bg-background px-4 py-3">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="truncate text-muted-foreground">{statusLabel}</span>
                  <span className="shrink-0 font-medium tabular-nums text-foreground">
                    {Math.round(displayProgress)}%
                  </span>
                </div>
                <Progress value={displayProgress} className="h-1.5" />
                {phase === "processing" ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Applying changes — do not close this tab</span>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {phase === "staged" || phase === "error" ? (
                <Button type="button" onClick={() => void startImport()}>
                  Start import
                </Button>
              ) : null}
              {isTransferring ? (
                <Button type="button" variant="outline" onClick={() => setCancelUploadDialogOpen(true)}>
                  Cancel import
                </Button>
              ) : null}
              {phase === "complete" ? (
                <Button type="button" variant="outline" onClick={resetUpload}>
                  Import another file
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="rounded-md bg-muted/40 px-4 py-3 text-xs text-muted-foreground space-y-1">
          <p>
            <strong className="text-foreground">CREATE</strong> — insert inventory + create creator user
          </p>
          <p>
            <strong className="text-foreground">EDIT</strong> — update by Username (empty cells keep existing
            values)
          </p>
          <p>
            <strong className="text-foreground">DELETE</strong> — remove rows; set{" "}
            <strong className="text-foreground">Delete Target</strong> to{" "}
            <code className="text-[11px]">inventory</code> (default),{" "}
            <code className="text-[11px]">user</code>, or <code className="text-[11px]">both</code>
          </p>
        </div>
      </div>

      {result ? (
        <div className="space-y-4">
          <h3 className="text-base font-semibold">Import summary</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard label="Total rows" value={result.total_rows} />
            <SummaryCard label="Created" value={result.created} />
            <SummaryCard label="Updated" value={result.updated} />
            <SummaryCard label="Deleted" value={result.deleted} />
            <SummaryCard label="Unchanged" value={result.unchanged} />
            <SummaryCard label="Users created" value={result.users_created} />
            <SummaryCard label="Users updated" value={result.users_updated} />
            <SummaryCard label="Users deleted" value={result.users_deleted} />
            <SummaryCard label="Skipped" value={result.skipped} />
          </div>

          {result.errors && result.errors.length > 0 ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-sm font-semibold text-destructive mb-2">
                Row errors ({result.errors.length})
              </p>
              <ul className="max-h-64 overflow-y-auto space-y-1 text-sm font-mono text-destructive/90">
                {result.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      <Dialog open={discardDialogOpen} onOpenChange={setDiscardDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Discard staged file?</DialogTitle>
            <DialogDescription>
              {stagedFile?.name} will be removed from the import queue. You can choose a different file
              afterward.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setDiscardDialogOpen(false)}>
              Keep file
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDiscardStaged}>
              Discard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelUploadDialogOpen} onOpenChange={setCancelUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel import?</DialogTitle>
            <DialogDescription>
              The upload is still in progress. Cancelling may leave partial changes on the server depending on
              how far processing got.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setCancelUploadDialogOpen(false)}>
              Keep importing
            </Button>
            <Button type="button" variant="destructive" onClick={confirmCancelUpload}>
              Cancel import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Leave this page?</DialogTitle>
            <DialogDescription>
              {isTransferring
                ? "An inventory import is in progress. Leaving now may interrupt the upload."
                : "You have a file staged for import. Leaving will discard it."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setLeaveDialogOpen(false)
                setPendingHref(null)
              }}
            >
              Stay on page
            </Button>
            <Button type="button" variant="destructive" onClick={confirmLeave}>
              Leave anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
