"use client"

import React, { createContext, useContext, useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"

interface RouteHistoryContextValue {
  history: string[]
}

const RouteHistoryContext = createContext<RouteHistoryContextValue | undefined>(undefined)

export function RouteHistoryProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [history, setHistory] = useState<string[]>([])
  const lastPathRef = useRef<string | null>(null)

  useEffect(() => {
    if (!pathname || pathname === lastPathRef.current) return
    setHistory((prev) => [...prev, pathname])
    lastPathRef.current = pathname
  }, [pathname])

  return (
    <RouteHistoryContext.Provider value={{ history }}>
      {children}
    </RouteHistoryContext.Provider>
  )
}

export function useRouteHistory(): RouteHistoryContextValue {
  const ctx = useContext(RouteHistoryContext)
  if (!ctx) {
    throw new Error("useRouteHistory must be used within RouteHistoryProvider")
  }
  return ctx
}

