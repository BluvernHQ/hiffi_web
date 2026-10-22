"use client"

import { useLayoutEffect } from "react"

let pendingRosterScroll: number | null = null

/** Remember #main-content position before a roster filter navigation. */
export function captureRosterScroll() {
  const main = document.getElementById("main-content")
  pendingRosterScroll = main?.scrollTop ?? window.scrollY
}

function applyRosterScroll() {
  if (pendingRosterScroll == null) return
  const main = document.getElementById("main-content")
  if (main) main.scrollTop = pendingRosterScroll
}

/** Reapply the saved position while the index loading state is on screen. */
export function RestoreRosterScroll() {
  useLayoutEffect(() => {
    applyRosterScroll()
    const frame = requestAnimationFrame(applyRosterScroll)
    return () => cancelAnimationFrame(frame)
  }, [])
  return null
}

/** Reapply the saved position once the roster is back, then forget it. */
export function useRestoreRosterScroll(key: unknown) {
  useLayoutEffect(() => {
    applyRosterScroll()
    const frame = requestAnimationFrame(() => {
      applyRosterScroll()
      pendingRosterScroll = null
    })
    return () => cancelAnimationFrame(frame)
  }, [key])
}
