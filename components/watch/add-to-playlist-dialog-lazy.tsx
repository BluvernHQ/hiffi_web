"use client"

import type { AddToPlaylistDialogProps } from "@/components/video/add-to-playlist-dialog"
import { AddToPlaylistDialog } from "@/components/video/add-to-playlist-dialog"

type Props = AddToPlaylistDialogProps

/**
 * Wraps the playlist dialog. The trigger path is a normal import so the server
 * HTML and the first client render share the same Radix ids. A lazy() boundary
 * here shifted those ids and failed hydration on the watch page.
 */
export function AddToPlaylistDialogLazy({ open, children, ...props }: Props) {
  if (!children && !open) return null

  return (
    <AddToPlaylistDialog open={open} {...props}>
      {children}
    </AddToPlaylistDialog>
  )
}
