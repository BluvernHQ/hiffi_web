export function truncateMetaDescription(text: string, max = 155): string {
  const t = text.replace(/\s+/g, " ").trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1).trim()}…`
}
