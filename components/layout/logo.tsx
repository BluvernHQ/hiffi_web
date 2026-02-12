"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  size?: number
  showText?: boolean
}

export function Logo({ className, size = 32, showText = false }: LogoProps) {
  const iconSize = showText ? Math.round(size * 1.6) : size

  return (
    <div className={cn("flex items-center", showText ? "gap-0" : "gap-2", className)}>
      <div className="relative" style={{ width: iconSize, height: iconSize }}>
        <Image
          src="/hiffi_logo.png"
          alt="Hiffi Logo"
          width={iconSize}
          height={iconSize}
          className="object-contain"
          priority
        />
      </div>
      {showText && (
        <Image
          src="/hiffi_work_red.png"
          alt="Hiffi"
          width={size * 3}
          height={size}
          className="h-auto object-contain"
          style={{ height: size * 0.8 }}
        />
      )}
    </div>
  )
}
