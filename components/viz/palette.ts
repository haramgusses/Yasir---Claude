// Performa data-viz palette, derived from the brand set
// #6a687a · #210124 · #e1e5f2 · #ffffff · #053225.
// The two data hues are validated tints of the brand green and plum
// (lightness band, chroma floor, CVD separation ΔE 34.8, contrast ≥ 3:1
// on white — dataviz six-checks validator, light mode). The originals are
// too dark/grey for marks, so they serve as ink and chrome instead.
export const VIZ = {
  ink: "#14302b", // primary chart text
  muted: "#6b827c", // axis labels, secondary text
  grid: "#e0e4df", // gridlines, bar tracks
  surface: "#ffffff", // charts sit on white cards
  green: "#1a7f5a", // data hue A — money in (light-surface validated)
  plum: "#8f63a1", // data hue B — money out (light-surface validated)
  deep: "#1f7a5c", // emphasis accent
  tooltip: "#14302b", // dark tooltip surface (white text)
} as const;

export const nzdShort = (cents: number) => {
  const v = cents / 100;
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}m`;
  if (abs >= 10_000) return `$${Math.round(v / 1000)}k`;
  if (abs >= 1_000) return `$${(v / 1000).toFixed(1)}k`;
  return `$${Math.round(v)}`;
};
