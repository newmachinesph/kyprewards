/**
 * The palette, for the places a class cannot reach: `style` props on SVG,
 * navigator options, status bars. The same values as tailwind.config.js and
 * packages/ui/src/tokens.css - change them there and here together.
 */
export const colors = {
  paper: "#faf8f3",
  ink: "#18120c",
  inkSoft: "#2c231b",
  accent: "#e8a33d",
  accentStrong: "#8f5510",
  surface: "#fffefb",
  surface2: "#eee9e0",
  muted: "#6f6359",
  mutedStrong: "#675b51",
  line: "#e5ded3",
  lineStrong: "#d6ccbf",
  success: "#0f7655",
  danger: "#b23b2b",
  white: "#ffffff",
} as const;

/**
 * The colours a merchant may pick for their card, by token. Mirrors
 * `BRAND_COLORS` in packages/ui, which the API stores the key of.
 */
export const brandColors: Record<
  string,
  { background: string; foreground: string }
> = {
  ink: { background: colors.ink, foreground: colors.paper },
  accent: { background: colors.accent, foreground: colors.ink },
  green: { background: colors.success, foreground: colors.paper },
  paper: { background: colors.surface2, foreground: colors.ink },
};

export function brandColor(token: string) {
  return brandColors[token] ?? brandColors.ink;
}

/** `rgba()` of a hex at an alpha, for inks over a card's own colour. */
export function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
