import { getArtistImageUrl } from "@/lib/artist-directory"

export const ARTIST_EDIT_IMAGE_MAX_BYTES = 2 * 1024 * 1024
export const ARTIST_EDIT_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp"

const HTTPS_URL_RE = /^https:\/\/.+/i
const DATA_IMAGE_RE = /^data:image\/(jpeg|jpg|png|webp);base64,/i

export function resolveArtistMediaPreviewUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  if (trimmed.startsWith("data:image/")) return trimmed
  return getArtistImageUrl(trimmed)
}

export function readImageFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result)
      else reject(new Error("Could not read image file."))
    }
    reader.onerror = () => reject(new Error("Could not read image file."))
    reader.readAsDataURL(file)
  })
}

export function validateArtistEditImageValue(
  value: string,
  label: string,
): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  if (trimmed.startsWith("data:image/")) {
    if (!DATA_IMAGE_RE.test(trimmed)) {
      return `${label} must be a JPEG, PNG, or WebP image.`
    }
    if (trimmed.length > 3_000_000) {
      return `${label} file is too large. Use an image under 2 MB or paste a link instead.`
    }
    return null
  }

  if (trimmed.length > 2000) {
    return `${label} URL is too long.`
  }

  if (!HTTPS_URL_RE.test(trimmed)) {
    return `${label} must be a valid https:// link or an uploaded image.`
  }

  return null
}

export async function processArtistEditImageFile(file: File): Promise<string> {
  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
  if (!validTypes.includes(file.type.toLowerCase())) {
    throw new Error("Use a JPEG, PNG, or WebP image.")
  }
  if (file.size > ARTIST_EDIT_IMAGE_MAX_BYTES) {
    throw new Error("Image must be under 2 MB.")
  }
  return readImageFileAsDataUrl(file)
}
