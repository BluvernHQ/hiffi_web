"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  size?: number
  showText?: boolean
}

export function Logo({ className, size = 32, showText = false }: LogoProps) {
  const iconSize = showText ? Math.round(size * 1.25) : size
  const iconResponsiveSize = showText ? `clamp(24px, 6.5vw, ${iconSize}px)` : `${iconSize}px`
  const textResponsiveHeight = showText ? `clamp(12px, 3vw, ${size * 0.5}px)` : `${size * 0.8}px`

  return (
    <div className={cn("flex items-center", showText ? "gap-0" : "gap-2", className)}>
      <div className="relative" style={{ width: iconResponsiveSize, height: iconResponsiveSize }}>
        <Image
          src="/hiffi_logo.png"
          alt="Hiffi Logo"
          width={iconSize}
          height={iconSize}
          className="object-contain block"
          priority
        />
      </div>
      {showText && (
        <Image
          src="/hiffi_word_black.png"
          alt="Hiffi"
          width={size * 3}
          height={size}
          className="h-auto object-contain -ml-2 relative -translate-y-px block"
          style={{ height: textResponsiveHeight }}
        />
      )}
    </div>
  )
}
