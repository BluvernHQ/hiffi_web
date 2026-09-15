/** Shared constraints for profile avatar + banner uploads. */

export const PROFILE_IMAGE_ACCEPT = "image/*"
export const PROFILE_IMAGE_MAX_BYTES = 10 * 1024 * 1024

/** Returns an error message if invalid; otherwise null. */
export function validateProfileImageFile(
  file: File,
  label: string = "Image",
): string | null {
  // Some browsers leave type empty for rare formats — still allow by extension.
  const type = (file.type || "").toLowerCase()
  const name = (file.name || "").toLowerCase()
  const looksLikeImage =
    type.startsWith("image/") ||
    /\.(jpe?g|png|gif|webp|bmp|heic|heif|avif|tiff?|svg)$/i.test(name)

  if (!looksLikeImage) {
    return `${label} must be an image file.`
  }

  if (file.size > PROFILE_IMAGE_MAX_BYTES) {
    return `${label} must be less than 10MB.`
  }

  return null
}
