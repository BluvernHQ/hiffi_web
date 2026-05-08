import { ReactNode } from "react"

const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi
const URL_EXACT_REGEX = /^(https?:\/\/[^\s]+|www\.[^\s]+)$/i

function renderDescriptionWithClickableLinks(text?: string | null): ReactNode {
  if (!text) return null

  const parts = text.split(URL_REGEX)

  return parts.map((part, index) => {
    const trimmedPart = part.trim()
    const isUrl = URL_EXACT_REGEX.test(trimmedPart)

    if (!isUrl) {
      return <span key={`text-${index}`}>{part}</span>
    }

    // Keep punctuation outside link to avoid malformed URLs.
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

export function DescriptionWithLinks({ text }: { text?: string | null }) {
  return <>{renderDescriptionWithClickableLinks(text)}</>
}

