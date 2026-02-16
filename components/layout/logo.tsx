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
    <div className={cn("flex items-center", className)}>
      <Image
        src="/appbarlogo.png"
        alt="Hiffi"
        width={showText ? size * 4 : size * 1.5}
        height={size}
        className="object-contain"
        priority
      />
    </div>
  )
}
