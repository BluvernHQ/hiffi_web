import { asApiError } from "@/lib/api/context"

/** User-facing message from flags API errors, fetch failures, or thrown strings. */
export function getFlagApiErrorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (typeof err === "string" && err.trim()) return err.trim()
  if (err instanceof Error && err.message.trim()) return err.message.trim()
  const api = asApiError(err)
  if (api?.message?.trim()) return api.message.trim()
  return fallback
}
