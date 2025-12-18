"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { getWorkersApiKey, WORKERS_BASE_URL } from "@/lib/storage"

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
 * Image component that fetches thumbnails with x-api-key header
 * Since HTML img tags don't support custom headers, we fetch as blob and create object URL
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
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [imageLoadError, setImageLoadError] = useState(false)
  const blobUrlRef = useRef<string | null>(null)

  useEffect(() => {
    // Only fetch with auth if it's a Workers URL
    const isWorkersUrl = src.startsWith(WORKERS_BASE_URL)
    
    if (!isWorkersUrl) {
      // For non-Workers URLs, use directly
      setBlobUrl(src)
      setIsLoading(false)
      return
    }

    let cancelled = false

    async function fetchImage() {
      try {
        setIsLoading(true)
        setError(false)

        const apiKey = getWorkersApiKey()
        // getWorkersApiKey() now provides a fallback in development, so this should not happen
        if (!apiKey) {
          console.error("[hiffi] No API key found (NEXT_PUBLIC_WORKERS_API_KEY not set), thumbnail will fail to load")
          throw new Error("API key not configured")
        }

        console.log("[hiffi] Fetching thumbnail from Workers:", src)
        console.log("[hiffi] Using API key:", apiKey ? `${apiKey.substring(0, 4)}...` : "NOT SET")
        
        const response = await fetch(src, {
          method: 'GET',
          headers: {
            'x-api-key': apiKey, // Always pass "SECRET_KEY" (or value from env var)
          },
          mode: 'cors', // Explicitly set CORS mode
          credentials: 'omit', // Don't send cookies
        })

        if (!response.ok) {
          const errorText = await response.text().catch(() => response.statusText)
          console.error("[hiffi] Fetch failed with status:", response.status, errorText)
          throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
        }

        if (cancelled) return

        const blob = await response.blob()
        
        // Validate that we got an image blob
        if (!blob.type.startsWith('image/')) {
          console.error("[AuthenticatedImage] Response is not an image:", blob.type, "URL:", src)
          throw new Error(`Invalid image type: ${blob.type}`)
        }
        
        // Check blob size - if it's too small, it might be an error page
        if (blob.size < 100) {
          console.error("[AuthenticatedImage] Blob size too small, might be an error:", blob.size, "URL:", src)
          throw new Error(`Image blob too small: ${blob.size} bytes`)
        }
        
        const url = URL.createObjectURL(blob)
        
        if (cancelled) {
          URL.revokeObjectURL(url)
          return
        }

        // Cleanup previous blob URL if exists
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current)
        }

        blobUrlRef.current = url
        setBlobUrl(url)
        setIsLoading(false)
      } catch (err: any) {
        console.error("[hiffi] Failed to fetch authenticated image:", err)
        console.error("[hiffi] Error details:", {
          message: err?.message,
          name: err?.name,
          stack: err?.stack,
          url: src,
        })
        
        // Check if it's a CORS error
        if (err?.message?.includes('Failed to fetch') || err?.name === 'TypeError') {
          console.error("[hiffi] This might be a CORS error. The Workers endpoint needs to allow requests from:", window.location.origin)
        }
        
        if (!cancelled) {
          setError(true)
          setIsLoading(false)
          onError?.()
        }
      }
    }

    fetchImage()

    return () => {
      cancelled = true
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
        blobUrlRef.current = null
      }
    }
  }, [src, onError])

  // Show loading state while fetching
  if (isLoading) {
    return (
      <div
        className={className}
        style={fill ? undefined : { width, height }}
      >
        <div className="w-full h-full bg-muted animate-pulse" />
      </div>
    )
  }

  // Handle image load error from Next.js Image component
  const handleImageError = () => {
    console.error("[AuthenticatedImage] Next.js Image failed to load blob URL:", blobUrl)
    setImageLoadError(true)
    onError?.()
  }

  // Show error state if fetch failed or image load failed
  if (error || imageLoadError || (!blobUrl && !isLoading)) {
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

  // Type guard: blobUrl must be non-null at this point
  if (!blobUrl) {
    return (
      <div
        className={className}
        style={fill ? undefined : { width, height }}
      >
        <div className="w-full h-full bg-muted animate-pulse" />
      </div>
    )
  }

  if (fill) {
    return (
      <Image
        src={blobUrl}
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
      src={blobUrl}
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
