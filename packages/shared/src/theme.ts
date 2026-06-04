/** Auxano design tokens — shared web & mobile (walnut palette) */

export const PALETTE = {
  antiqueWhite: "#ffedd8",
  softApricot: "#f3d5b5",
  tan: "#e7bc91",
  lightBronze: "#d4a276",
  camel: "#bc8a5f",
  fadedCopper: "#a47148",
  toffeeBrown: "#8b5e34",
  walnut: "#6f4518",
  walnut2: "#603808",
  walnut3: "#583101",
} as const;

export const AUXANO_THEME = {
  background: "#1a1209",
  backgroundSubtle: "#22160c",
  surface: "#2a1a0e",
  surfaceElevated: "#352214",
  card: "rgba(42, 26, 14, 0.65)",
  border: "rgba(255, 237, 216, 0.1)",
  borderStrong: "rgba(212, 162, 118, 0.22)",
  textPrimary: PALETTE.antiqueWhite,
  textSecondary: PALETTE.softApricot,
  textMuted: PALETTE.tan,
  textFaint: "rgba(231, 188, 145, 0.55)",
  accent: PALETTE.camel,
  accentHover: PALETTE.lightBronze,
  accentMuted: "rgba(188, 138, 95, 0.18)",
  positive: PALETTE.lightBronze,
  positiveMuted: "rgba(212, 162, 118, 0.2)",
  negative: PALETTE.toffeeBrown,
  negativeMuted: "rgba(139, 94, 52, 0.25)",
  glass: "rgba(42, 26, 14, 0.55)",
  glow: "rgba(111, 69, 24, 0.2)",
} as const;

export const PAPER_TRADING_INITIAL_BALANCE = 100_000;

export const FONT_FAMILY = "Anaheim";

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  full: 9999,
} as const;
