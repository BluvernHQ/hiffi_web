"use client"

import { useRef, useState } from "react"
import { ImagePlus, Link2, Upload, X } from "lucide-react"
import {
  ARTIST_EDIT_IMAGE_ACCEPT,
  processArtistEditImageFile,
  resolveArtistMediaPreviewUrl,
} from "@/lib/artist-edit-images"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type ArtistEditImageFieldProps = {
  id: string
  label: string
  description: string
  value: string
  currentValue?: string
  onChange: (value: string) => void
  error?: string
  variant: "profile" | "banner"
}

export function ArtistEditImageField({
  id,
  label,
  description,
  value,
  currentValue,
  onChange,
  error,
  variant,
}: ArtistEditImageFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<"upload" | "url">("upload")
  const [uploadError, setUploadError] = useState<string | null>(null)

  const previewSrc = resolveArtistMediaPreviewUrl(value || currentValue)
  const isProfile = variant === "profile"

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadError(null)
    try {
      const dataUrl = await processArtistEditImageFile(file)
      onChange(dataUrl)
      setMode("upload")
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Could not use that image.")
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const clearImage = () => {
    onChange("")
    setUploadError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor={id}>{label}</Label>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>

      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-border bg-muted/20",
          isProfile ? "p-4" : "p-0",
        )}
      >
        <div
          className={cn(
            "relative flex items-center justify-center overflow-hidden bg-zinc-900",
            isProfile ? "mx-auto h-28 w-28 rounded-full" : "aspect-[3/1] w-full rounded-xl",
          )}
        >
          {previewSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewSrc} alt="" className="h-full w-full object-cover" />
          ) : (
            <div
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-white/50",
                isProfile ? "p-2 text-center" : "p-6",
              )}
            >
              <ImagePlus className={cn(isProfile ? "h-6 w-6" : "h-8 w-8")} aria-hidden />
              <span className="text-[10px] font-semibold uppercase tracking-wider sm:text-xs">
                No image
              </span>
            </div>
          )}
        </div>

        <div className={cn("space-y-3", isProfile ? "mt-4" : "border-t border-border p-4")}>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("upload")}
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                mode === "upload"
                  ? "bg-[#E8192C] text-white"
                  : "bg-white text-foreground ring-1 ring-border hover:bg-muted/40",
              )}
            >
              <Upload className="h-3.5 w-3.5" aria-hidden />
              Upload
            </button>
            <button
              type="button"
              onClick={() => setMode("url")}
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                mode === "url"
                  ? "bg-[#E8192C] text-white"
                  : "bg-white text-foreground ring-1 ring-border hover:bg-muted/40",
              )}
            >
              <Link2 className="h-3.5 w-3.5" aria-hidden />
              Link
            </button>
            {value ? (
              <button
                type="button"
                onClick={clearImage}
                className="inline-flex items-center justify-center rounded-lg bg-white px-3 py-2 text-xs font-semibold text-muted-foreground ring-1 ring-border transition-colors hover:bg-muted/40"
                aria-label={`Clear ${label.toLowerCase()}`}
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            ) : null}
          </div>

          {mode === "upload" ? (
            <>
              <input
                ref={fileInputRef}
                id={id}
                type="file"
                accept={ARTIST_EDIT_IMAGE_ACCEPT}
                onChange={handleFileSelect}
                className="sr-only"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-xl border border-dashed border-border bg-white px-3 py-3 text-xs font-medium text-muted-foreground transition-colors hover:border-[#E8192C]/40 hover:text-foreground"
              >
                Choose JPEG, PNG, or WebP (max 2 MB)
              </button>
            </>
          ) : (
            <Input
              id={id}
              value={value.startsWith("data:") ? "" : value}
              onChange={(event) => onChange(event.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="h-10 rounded-xl text-sm"
            />
          )}
        </div>
      </div>

      {uploadError ? <p className="text-sm text-destructive">{uploadError}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
