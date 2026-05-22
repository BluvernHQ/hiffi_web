import { Fragment, ReactNode } from "react"

const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi
const URL_EXACT_REGEX = /^(https?:\/\/[^\s]+|www\.[^\s]+)$/i

const EMPTY_DESCRIPTION_PLACEHOLDERS = new Set(["null", "undefined", "n/a", "na", "none", "-", "—"])

/** Normalize API description values; returns "" when nothing meaningful to show. */
export function normalizeVideoDescriptionText(raw?: string | null): string {
  if (raw == null) return ""
  let text = String(raw).replace(/\0/g, "")
  text = text.replace(/<br\s*\/?>/gi, "\n")
  text = text.replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
  text = text.replace(/<[^>]*>/g, "")
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  text = text
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trimEnd())
    .join("\n")
  text = text.replace(/\n{3,}/g, "\n\n").trim()
  if (!text || EMPTY_DESCRIPTION_PLACEHOLDERS.has(text.toLowerCase())) return ""
  return text
}

export function getVideoDescriptionFromRecord(
  video?: { videoDescription?: string; video_description?: string; description?: string } | null,
): string {
  if (!video) return ""
  const raw = video.videoDescription ?? video.video_description ?? video.description ?? ""
  return normalizeVideoDescriptionText(raw)
}

export function hasDisplayableVideoDescription(
  video?: { videoDescription?: string; video_description?: string; description?: string } | null,
): boolean {
  return getVideoDescriptionFromRecord(video).length > 0
}

function renderLineWithClickableLinks(line: string): ReactNode {
  const parts = line.split(URL_REGEX)

  return parts.map((part, index) => {
    const trimmedPart = part.trim()
    const isUrl = URL_EXACT_REGEX.test(trimmedPart)

    if (!isUrl) {
      return <span key={`text-${index}`}>{part}</span>
    }

    const match = part.match(/^(.*?)([.,!?;:)]*)$/)
    const urlText = match?.[1] ?? part
    const trailingPunctuation = match?.[2] ?? ""
    const href = urlText.startsWith("http://") || urlText.startsWith("https://") ? urlText : `https://${urlText}`

    return (
      <span key={`link-${index}`}>
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
          {urlText}
        </a>
        {trailingPunctuation}
      </span>
    )
  })
}

function renderDescriptionWithClickableLinks(text?: string | null): ReactNode {
  const normalized = normalizeVideoDescriptionText(text)
  if (!normalized) return null

  const lines = normalized.split("\n")

  return lines.map((line, lineIndex) => (
    <Fragment key={`line-${lineIndex}`}>
      {lineIndex > 0 ? <br /> : null}
      {line.length > 0 ? renderLineWithClickableLinks(line) : null}
    </Fragment>
  ))
}

export function DescriptionWithLinks({ text }: { text?: string | null }) {
  return <>{renderDescriptionWithClickableLinks(text)}</>
}
