/**
 * Shared share/copy logic for profile and video pages.
 * Tries Web Share API, then clipboard API, then execCommand fallback.
 */

export type ShareResult =
  | { success: true; method: "share" }
  | { success: true; method: "clipboard" }
  | { success: false; cancelled?: boolean }

export interface ShareOptions {
  title: string
  text?: string
  url: string
}

/**
 * Share a URL using Web Share API when available, otherwise copy to clipboard.
 * Uses the same pattern as the profile page: shareData with title, text, url;
 * canShare check before calling share; fallback to copy.
 * If clipboard API fails, tries execCommand('copy') for older or restricted contexts.
 */
export async function shareUrl(options: ShareOptions): Promise<ShareResult> {
  const { title, text, url } = options
  if (typeof window === "undefined") return { success: false }

  const shareData: ShareData = {
    title,
    url,
    ...(text != null && text !== title ? { text } : {}),
  }

  // 1. Try Web Share API (mobile / supported desktop)
  if (navigator.share) {
    try {
      if (navigator.canShare && !navigator.canShare(shareData)) {
        throw new Error("Cannot share this data format")
      }
      await navigator.share(shareData)
      return { success: true, method: "share" }
    } catch (err: unknown) {
      const name = err && typeof err === "object" && "name" in err ? (err as { name: string }).name : ""
      if (name === "AbortError") {
        // User dismissed the native share sheet: not an actual error.
        return { success: false, cancelled: true }
      }
    }
  }

  // 2. Fallback: copy URL to clipboard
  try {
    await navigator.clipboard.writeText(url)
    return { success: true, method: "clipboard" }
  } catch {
    // 3. Last resort: execCommand for contexts where clipboard API is restricted
    try {
      const textarea = document.createElement("textarea")
      textarea.value = url
      textarea.setAttribute("readonly", "")
      textarea.style.position = "fixed"
      textarea.style.left = "-9999px"
      document.body.appendChild(textarea)
      textarea.select()
      const ok = document.execCommand("copy")
      document.body.removeChild(textarea)
      if (ok) return { success: true, method: "clipboard" }
    } catch {
      // ignore
    }
  }

  return { success: false }
}
