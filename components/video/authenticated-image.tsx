"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { WORKERS_BASE_URL } from "@/lib/storage"

interface AuthenticatedImageProps {
  src: string
  alt: string
  fill?: boolean
  width?: number
  height?: number
  className?: string
  priority?: boolean
  sizes?: string
  onError?: () => void
}

/**
 * Image component that uses a server-side proxy to fetch authenticated images.
 * This eliminates the need for fetch -> Blob -> URL.createObjectURL on the client,
 * which prevents memory leaks and enables browser-native caching.
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
  onError,
}: AuthenticatedImageProps) {
  const [imageLoadError, setImageLoadError] = useState(false)

  // Determine the final source URL
  const getDisplayUrl = () => {
    if (!src) return null
    
    // Only proxy if it's a Workers URL
    if (src.startsWith(WORKERS_BASE_URL)) {
      const path = src.replace(`${WORKERS_BASE_URL}/`, "")
      return `/proxy/image/${path}`
    }
    
    return src
  }

  const displayUrl = getDisplayUrl()

  // Handle image load error
  const handleImageError = () => {
    console.error("[AuthenticatedImage] Failed to load image:", displayUrl)
    setImageLoadError(true)
    onError?.()
  }

  // Show error state if no URL or load failed
  if (!displayUrl || imageLoadError) {
    return (
      <div
        className={className}
        style={fill ? undefined : { width, height }}
      >
        <div className="w-full h-full bg-muted flex items-center justify-center">
          <span className="text-muted-foreground text-xs">No thumbnail</span>
        </div>
      </div>
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
