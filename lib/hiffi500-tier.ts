/**
 * Rank-derived tier badge. The raw composite score is intentionally not shown
 * as a user-facing number (per API guidance) — rank + tier reads better.
 */
export function topArtistTier(rank: number): { label: string; highlight: boolean } {
  if (rank <= 10) return { label: "Global Velocity", highlight: true }
  if (rank <= 50) return { label: "Hot 50", highlight: false }
  if (rank <= 150) return { label: "Rising", highlight: false }
  return { label: "Charting", highlight: false }
}
