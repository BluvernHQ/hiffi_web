"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { Download, Link2, Loader2, RotateCw, Share2 } from "lucide-react"
import type { TopArtist } from "@/lib/top-artists"
import {
  SHARE_CARD_SIZE,
  shareCardFilename,
  shareCardPath,
  shareHeadline,
  sharePagePath,
  type ChartShareScope,
  type ShareCardFormat,
} from "@/lib/top-chart-share"
import { cn } from "@/lib/utils"

type Prepared = { key: string; file: File; url: string }
type AppId = "x" | "whatsapp" | "instagram" | "snapchat" | "facebook" | "telegram" | "copy" | "more"

const BRAND_PATHS: Partial<Record<AppId, string>> = {
  x: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  whatsapp:
    "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z",
  instagram:
    "M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5zm8.75 2.25a1.125 1.125 0 1 1 0 2.25 1.125 1.125 0 0 1 0-2.25zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z",
  snapchat:
    "M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z",
  facebook:
    "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
  telegram:
    "M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z",
}

const APPS: Array<{ id: AppId; label: string }> = [
  { id: "x", label: "X" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "instagram", label: "Instagram" },
  { id: "snapchat", label: "Snapchat" },
  { id: "facebook", label: "Facebook" },
  { id: "telegram", label: "Telegram" },
  { id: "copy", label: "Copy" },
  { id: "more", label: "More" },
]

function AppIcon({ id }: { id: AppId }) {
  if (id === "copy") return <Link2 className="h-[18px] w-[18px]" aria-hidden />
  if (id === "more") return <Share2 className="h-[18px] w-[18px]" aria-hidden />
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current" aria-hidden>
      <path d={BRAND_PATHS[id]} />
    </svg>
  )
}

function isMobileDevice(): boolean {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
}

function canShareFile(file: File): boolean {
  try {
    return typeof navigator.share === "function" && (!navigator.canShare || navigator.canShare({ files: [file] }))
  } catch {
    return false
  }
}

async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    const field = document.createElement("textarea")
    field.value = value
    field.setAttribute("readonly", "")
    field.style.position = "fixed"
    field.style.left = "-9999px"
    document.body.appendChild(field)
    field.select()
    const copied = document.execCommand("copy")
    field.remove()
    return copied
  }
}

function downloadFile(file: File) {
  const url = URL.createObjectURL(file)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = file.name
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 2000)
}

function openWindow(url: string) {
  window.open(url, "_blank", "noopener,noreferrer")
}

export function TopChartSharePanel({ artist, scope }: { artist: TopArtist; scope: ChartShareScope }) {
  const [format, setFormat] = useState<ShareCardFormat>("square")
  const [prepared, setPrepared] = useState<Prepared | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [status, setStatus] = useState("")
  const statusTimer = useRef(0)
  const objectUrl = useRef<string | null>(null)

  const cardPath = shareCardPath(artist.username, scope, format)
  const headline = shareHeadline(artist, scope)
  const [origin, setOrigin] = useState("https://hiffi.com")
  useEffect(() => setOrigin(window.location.origin), [])
  const link = `${origin}${sharePagePath(artist.username, scope)}`
  const caption = `${headline}\n\n${link}`
  const ready = prepared?.key === cardPath ? prepared : null

  // Fetch the PNG up front so Share runs inside the click (Safari drops the gesture after an await).
  useEffect(() => {
    const controller = new AbortController()
    setFailed(false)
    fetch(cardPath, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status))
        return res.blob()
      })
      .then((blob) => {
        const file = new File([blob], shareCardFilename(artist.username, format), { type: "image/png" })
        if (objectUrl.current) URL.revokeObjectURL(objectUrl.current)
        objectUrl.current = URL.createObjectURL(blob)
        setPrepared({ key: cardPath, file, url: objectUrl.current })
      })
      .catch((error: unknown) => {
        if ((error as Error)?.name !== "AbortError") setFailed(true)
      })
    return () => controller.abort()
  }, [artist.username, cardPath, format, attempt])

  useEffect(
    () => () => {
      window.clearTimeout(statusTimer.current)
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current)
    },
    [],
  )

  const flash = useCallback((message: string) => {
    window.clearTimeout(statusTimer.current)
    setStatus(message)
    statusTimer.current = window.setTimeout(() => setStatus(""), 2600)
  }, [])

  /** Share the PNG through the OS sheet; resolves false when the device can't share files. */
  const shareFile = useCallback(async (): Promise<boolean> => {
    if (!ready || !canShareFile(ready.file)) return false
    try {
      await navigator.share({ files: [ready.file], title: headline, text: caption })
      flash("Shared")
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") flash("Couldn’t open sharing. Try Download.")
    }
    return true
  }, [caption, flash, headline, ready])

  const saveWithCaption = useCallback(async () => {
    if (!ready) return false
    downloadFile(ready.file)
    await copyText(caption)
    return true
  }, [caption, ready])

  const onShareImage = async () => {
    if (await shareFile()) return
    if (await saveWithCaption()) flash("Card downloaded, caption copied")
  }

  const onDownload = () => {
    if (!ready) return
    downloadFile(ready.file)
    flash("Card downloaded")
  }

  const onApp = async (id: AppId) => {
    const encodedLink = encodeURIComponent(link)
    const encodedText = encodeURIComponent(headline)
    if (id === "x") return openWindow(`https://x.com/intent/tweet?text=${encodedText}&url=${encodedLink}`)
    if (id === "facebook") return openWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodedLink}`)
    if (id === "telegram") return openWindow(`https://t.me/share/url?url=${encodedLink}&text=${encodedText}`)
    if (id === "copy") return flash((await copyText(caption)) ? "Caption and link copied" : "Couldn’t copy. Try again.")

    if (await shareFile()) return
    if (!(await saveWithCaption())) return
    if (id === "whatsapp") {
      openWindow(`https://wa.me/?text=${encodeURIComponent(`${headline}\n${link}`)}`)
      return flash("Card saved. Attach it in WhatsApp.")
    }
    if (id === "instagram") {
      if (!isMobileDevice()) openWindow("https://www.instagram.com/")
      return flash("Card saved. Post it on Instagram.")
    }
    if (id === "snapchat") {
      openWindow(`https://www.snapchat.com/scan?attachmentUrl=${encodedLink}`)
      return flash("Card saved. Add it in Snapchat.")
    }
    flash("Card downloaded, caption copied")
  }

  const size = SHARE_CARD_SIZE[format]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/45">Share card</h3>
        <div role="radiogroup" aria-label="Card format" className="flex rounded-full border border-white/12 p-0.5">
          {(["square", "story"] as const).map((entry) => (
            <button
              key={entry}
              type="button"
              role="radio"
              aria-checked={format === entry}
              onClick={() => setFormat(entry)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors",
                format === entry ? "bg-[#F4F1EA] text-[#0B0B0C]" : "text-white/60 hover:text-white",
              )}
            >
              {entry}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <div
          className={cn(
            "relative w-full overflow-hidden rounded-2xl bg-[#0A0A0C] ring-1 ring-white/10",
            format === "story" ? "max-w-[240px]" : "max-w-[360px]",
          )}
          style={{ aspectRatio: `${size.width} / ${size.height}` }}
        >
          {ready ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ready.url}
              alt={`${headline} — share card`}
              className="artist-rise absolute inset-0 h-full w-full object-cover"
            />
          ) : failed ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
              <p className="text-sm text-white/60">The card didn’t render.</p>
              <button
                type="button"
                onClick={() => setAttempt((value) => value + 1)}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white/80 hover:border-white/50"
              >
                <RotateCw className="h-3.5 w-3.5" aria-hidden />
                Try again
              </button>
            </div>
          ) : (
            <div className="ink-skeleton absolute inset-0" aria-hidden />
          )}
          {!ready && !failed ? <span className="sr-only">Creating the card</span> : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <ActionButton onClick={onShareImage} disabled={!ready} primary>
          {ready ? <Share2 className="h-4 w-4" aria-hidden /> : <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Share image
        </ActionButton>
        <ActionButton onClick={onDownload} disabled={!ready}>
          <Download className="h-4 w-4" aria-hidden />
          Download
        </ActionButton>
      </div>

      <ul className="grid grid-cols-4 gap-x-2 gap-y-4">
        {APPS.map((app) => (
          <li key={app.id}>
            <button
              type="button"
              onClick={() => onApp(app.id)}
              disabled={!ready && app.id !== "x" && app.id !== "facebook" && app.id !== "telegram" && app.id !== "copy"}
              className="group flex w-full flex-col items-center gap-2 text-[11px] font-medium text-white/60 transition-colors hover:text-white disabled:opacity-40"
              aria-label={app.id === "copy" ? "Copy caption and link" : app.id === "more" ? "More sharing options" : `Share on ${app.label}`}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.06] ring-1 ring-white/10 transition-colors group-hover:bg-white/[0.12]">
                <AppIcon id={app.id} />
              </span>
              {app.label}
            </button>
          </li>
        ))}
      </ul>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-sm leading-6 text-white/80">{headline}</p>
        <p className="mt-1 truncate font-mono text-[11px] text-white/40">{link}</p>
      </div>

      <p role="status" aria-live="polite" className={cn("min-h-5 text-center text-xs text-[#7BD88F]", !status && "invisible")}>
        {status || "\u00a0"}
      </p>
    </div>
  )
}

function ActionButton({
  children,
  onClick,
  disabled,
  primary = false,
}: {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  primary?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition-colors disabled:opacity-60",
        primary
          ? "bg-[#E8192C] text-white hover:bg-[#d01528]"
          : "border border-white/15 text-[#F4F1EA] hover:border-white/40 hover:bg-white/[0.04]",
      )}
    >
      {children}
    </button>
  )
}
