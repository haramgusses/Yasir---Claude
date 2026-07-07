// Performa data-viz palette, derived from the brand set
// #6a687a · #210124 · #e1e5f2 · #ffffff · #053225.
// The two data hues are validated tints of the brand green and plum
// (lightness band, chroma floor, CVD separation ΔE 34.8, contrast ≥ 3:1
// on white — dataviz six-checks validator, light mode). The originals are
// too dark/grey for marks, so they serve as ink and chrome instead.
export const VIZ = {
  ink: "#e8ecf8", // primary chart text
  muted: "#9aa4c7", // axis labels, secondary text
  grid: "rgba(225,229,242,0.13)", // gridlines, bar tracks
  surface: "transparent", // charts sit on glass panels
  green: "#25a06e", // data hue A — money in (dark-surface validated)
  plum: "#a87ec0", // data hue B — money out (dark-surface validated)
  deep: "#30cfc3", // emphasis accent
  tooltip: "#0d1531", // tooltip surface on dark
} as const;

export const nzdShort = (cents: number) => {
  const v = cents / 100;
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}m`;
  if (abs >= 10_000) return `$${Math.round(v / 1000)}k`;
  if (abs >= 1_000) return `$${(v / 1000).toFixed(1)}k`;
  return `$${Math.round(v)}`;
};
