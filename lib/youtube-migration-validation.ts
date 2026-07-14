import { parseYoutubeTargetUrl } from "@/lib/youtube-url"

export function isValidYoutubeUrl(value: string): boolean {
  try {
    const url = new URL(value.trim())
    const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "")
    if (host !== "youtube.com" && host !== "youtu.be") return false
    return parseYoutubeTargetUrl(value) !== null
  } catch {
    return false
  }
}
