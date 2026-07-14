/**
 * Quick sanity check for hero headline binary-search fit.
 * Run with: npx tsx app/(main)/about/components/hiffi-about/fit-hero-headline.check.ts
 *
 * This mirrors fitHeroHeadline() math without DOM.
 */
function fitSize(fontPx: number, lineWidths: number[], maxW: number) {
  const overflows = (size: number) =>
    lineWidths.some((w) => (w * size) / fontPx > maxW + 1);

  if (!overflows(fontPx)) return fontPx;

  let lo = Math.max(18, fontPx * 0.35);
  let hi = fontPx;
  for (let i = 0; i < 14; i++) {
    const mid = (lo + hi) / 2;
    if (overflows(mid)) hi = mid;
    else lo = mid;
  }
  return lo;
}

const cases = [
  { name: "fits", fontPx: 40, widths: [200, 280], maxW: 300, expectFit: true },
  { name: "overflow", fontPx: 40, widths: [200, 400], maxW: 300, expectFit: false },
];

for (const c of cases) {
  const size = fitSize(c.fontPx, c.widths, c.maxW);
  const ok = c.expectFit ? size === c.fontPx : size < c.fontPx;
  console.log(c.name, size.toFixed(2), ok ? "ok" : "FAIL");
}
