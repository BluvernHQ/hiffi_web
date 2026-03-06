"use client"

import { usePathname, useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"

/**
 * Persistent app shell (navbar + sidebar + main) for all main routes.
 * Only the page content (children) changes on navigation, so the navbar
 * does not re-render or remount when moving between pages.
 */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const currentFilter = pathname === "/following" ? ("following" as const) : ("all" as const)

  const onFilterChange = (filter: "all" | "following") => {
    router.push(filter === "following" ? "/following" : "/")
  }

  return (
    <AppLayout currentFilter={currentFilter} onFilterChange={onFilterChange}>
      {children}
    </AppLayout>
  )
}
