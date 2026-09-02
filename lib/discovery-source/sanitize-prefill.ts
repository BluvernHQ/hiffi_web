/** Ignore unreplaced ESP merge tags (e.g. `{{First_Name}}`) in URL prefill params. */
export function sanitizeDiscoveryPrefill(value: string | undefined): string {
  const trimmed = value?.trim() ?? ""
  if (!trimmed) return ""
  if (/^\{\{[\w.]+\}\}$/.test(trimmed)) return ""
  return trimmed
}
