"use client"

import { Loader2 } from "lucide-react"
import { useRequireRole } from "@/hooks/use-require-role"
import type { UserRole } from "@/lib/auth"

type RequireRoleProps = {
  role: UserRole | UserRole[]
  redirectTo: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RequireRole({ role, redirectTo, children, fallback }: RequireRoleProps) {
  const { verified, authLoading } = useRequireRole(role, redirectTo)

  if (authLoading || !verified) {
    return (
      fallback ?? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    )
  }

  return <>{children}</>
}
