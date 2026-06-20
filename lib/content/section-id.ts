/** Stable anchor IDs from section headings (for TOC + deep links). */
export function sectionId(title: string): string {
  return title
    .toLowerCase()
    .replace(/&amp;/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}
