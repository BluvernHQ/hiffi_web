"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  size?: number
  showText?: boolean
}

export function Logo({ className, size = 32, showText = false }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <Image
          src="/hiffi_logo.png"
          alt="Hiffi Logo"
          width={size}
          height={size}
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
