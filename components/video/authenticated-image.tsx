"use client"

import { useState, type CSSProperties } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { WORKERS_BASE_URL } from "@/lib/storage"

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
      <Image
        src="/appbarlogo.png"
        alt=""
        width={240}
        height={160}
        className="h-[38%] w-auto max-h-20 max-w-[min(78%,9rem)] object-contain opacity-25"
        sizes="(max-width: 768px) 30vw, 160px"
      />
    </div>
  )
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
  const [imageLoadError, setImageLoadError] = useState(false)

  const getDisplayUrl = () => {
    if (!src) return null

    if (authenticated && src.startsWith(WORKERS_BASE_URL)) {
      const path = src.replace(`${WORKERS_BASE_URL}/`, "")
      return `/proxy/image/${path}`
    }

    return src
  }

  const displayUrl = getDisplayUrl()

  const handleImageError = () => {
    setImageLoadError(true)
    onError?.()
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

  if (fill) {
    return (
      <Image
        src={displayUrl}
        alt={alt}
        fill
        className={className}
        priority={priority}
        sizes={sizes}
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
      sizes={sizes}
      onError={handleImageError}
      unoptimized={true}
    />
  )
}
