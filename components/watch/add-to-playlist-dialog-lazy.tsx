"use client"

import { lazy, Suspense, type ReactNode } from "react"
import type { AddToPlaylistDialogProps } from "@/components/video/add-to-playlist-dialog"

const AddToPlaylistDialog = lazy(() =>
  import("@/components/video/add-to-playlist-dialog").then((m) => ({
    default: m.AddToPlaylistDialog,
  })),
)

type Props = AddToPlaylistDialogProps

/** Loaded when opened, or immediately when wrapping a save trigger (`children`) for popover anchoring. */
export function AddToPlaylistDialogLazy({ open, children, ...props }: Props) {
  if (children) {
    return (
      <Suspense fallback={children}>
        <AddToPlaylistDialog open={open} {...props}>
          {children}
        </AddToPlaylistDialog>
      </Suspense>
    )
  }

  if (!open) return null

  return (
    <Suspense fallback={null}>
      <AddToPlaylistDialog open={open} {...props} />
    </Suspense>
  )
}
