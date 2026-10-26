"use client"

import { useState, type CSSProperties } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { getWorkersBaseUrl } from "@/lib/storage"

/** Faded app logo when a video thumbnail URL is missing or fails to load. */
export function VideoThumbnailPlaceholder({
  fill,
  className,
  style,
}: {
  fill?: boolean
  className?: string
  style?: CSSProperties
}) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-muted",
        fill && "absolute inset-0 size-full",
        className,
      )}
      style={style}
      aria-hidden
    >
      <img
        src="/appbarlogo.png"
        alt=""
        className="h-[38%] w-auto max-h-20 max-w-[min(78%,9rem)] object-contain opacity-25"
      />
    </div>
  )
}

function isPublicThumbnailUrl(src: string): boolean {
  return src.includes("/thumbnails/")
}

/**
 * Public Workers thumbnails load directly so the browser and Cloudflare can cache them.
 * Other Workers images still go through the same-origin proxy when auth is required.
 */
function displayUrlFor(src: string, authenticated: boolean): string | null {
  const trimmed = src.trim()
  if (!trimmed) return null
  if (!authenticated || isPublicThumbnailUrl(trimmed)) return trimmed

  const workersBase = getWorkersBaseUrl()
  if (trimmed.startsWith(workersBase)) {
    const path = trimmed.slice(workersBase.length).replace(/^\//, "")
    return `/proxy/image/${path}`
  }
  return trimmed
}

interface AuthenticatedImageProps {
  src: string
  alt: string
  fill?: boolean
  width?: number
  height?: number
  className?: string
  priority?: boolean
  sizes?: string
  authenticated?: boolean
  onError?: () => void
}

/**
 * Image component that uses a server-side proxy to fetch authenticated images.
 * This eliminates the need for fetch -> Blob -> URL.createObjectURL on the client,
 * which prevents memory leaks and enables browser-native caching.
 *
 * If authenticated is false (e.g. for public thumbnails), it uses the source URL directly.
 */
export function AuthenticatedImage({
  src,
  alt,
  fill,
  width,
  height,
  className,
  priority = false,
  sizes,
  authenticated = true,
  onError,
}: AuthenticatedImageProps) {
  const displayUrl = displayUrlFor(src, authenticated)
  const directThumbnail = Boolean(displayUrl && isPublicThumbnailUrl(displayUrl))
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const imageLoadError = Boolean(displayUrl) && failedUrl === displayUrl

  const markImageFailed = (img?: HTMLImageElement | null) => {
    if (img && !(img.complete && img.naturalWidth === 0)) return
    if (!displayUrl || failedUrl === displayUrl) return
    setFailedUrl(displayUrl)
    onError?.()
  }

  const handleImageError = () => {
    markImageFailed()
  }

  // A cached 404 can fail before React attaches onError, which leaves the browser's
  // broken-image icon in the corner instead of the watermark.
  const failedImageRef = (img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth === 0) markImageFailed(img)
  }

  if (!displayUrl || imageLoadError) {
    return (
      <VideoThumbnailPlaceholder
        fill={fill}
        className={className}
        style={
          fill ? undefined : width !== undefined && height !== undefined ? { width, height } : undefined
        }
      />
    )
  }

  const imageLoading = priority ? "eager" : "lazy"

  if (directThumbnail) {
    return (
      // Native img so the browser keeps the Cloudflare response instead of re-requesting through Next.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={displayUrl}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        className={cn(fill && "absolute inset-0 size-full", className)}
        loading={imageLoading}
        decoding="async"
        fetchPriority={priority ? "high" : "low"}
        ref={failedImageRef}
        onError={handleImageError}
      />
    )
  }

  if (fill) {
    return (
      <Image
        src={displayUrl}
        alt={alt}
        fill
        className={className}
        priority={priority}
        loading={imageLoading}
        sizes={sizes}
        ref={failedImageRef}
        onError={handleImageError}
        unoptimized={true}
      />
    )
  }

  return (
    <Image
      src={displayUrl}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      loading={imageLoading}
      sizes={sizes}
      ref={failedImageRef}
      onError={handleImageError}
      unoptimized={true}
    />
  )
}
