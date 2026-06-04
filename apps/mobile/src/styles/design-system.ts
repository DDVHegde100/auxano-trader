/**
 * Auxano mobile design system — walnut palette, Anaheim typography
 * Production-grade spacing, borders, and component factories
 */

import { StyleSheet, type TextStyle, type ViewStyle } from "react-native";
import { AUXANO_THEME, PALETTE, SPACING, RADIUS, FONT_FAMILY } from "@auxano/shared";

export const colors = {
  ...PALETTE,
  background: AUXANO_THEME.background,
  backgroundSubtle: AUXANO_THEME.backgroundSubtle,
  surface: AUXANO_THEME.surface,
  surfaceElevated: AUXANO_THEME.surfaceElevated,
  text: AUXANO_THEME.textPrimary,
  textSecondary: AUXANO_THEME.textSecondary,
  textMuted: AUXANO_THEME.textMuted,
  textFaint: AUXANO_THEME.textFaint,
  accent: AUXANO_THEME.accent,
  accentMuted: AUXANO_THEME.accentMuted,
  positive: AUXANO_THEME.positive,
  negative: AUXANO_THEME.negative,
  border: AUXANO_THEME.border,
  borderStrong: AUXANO_THEME.borderStrong,
};

export const fontFamily = FONT_FAMILY;

export const typography = StyleSheet.create({
  display: {
    fontFamily: FONT_FAMILY,
    fontSize: 32,
    lineHeight: 38,
    color: colors.text,
    letterSpacing: -0.5,
  },
  h1: {
    fontFamily: FONT_FAMILY,
    fontSize: 28,
    lineHeight: 34,
    color: colors.text,
    letterSpacing: -0.3,
  },
  h2: {
    fontFamily: FONT_FAMILY,
    fontSize: 22,
    lineHeight: 28,
    color: colors.text,
  },
  h3: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    lineHeight: 24,
    color: colors.text,
  },
  body: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
  },
  bodySm: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  caption: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
  },
  overline: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.textFaint,
  },
  tabular: {
    fontVariant: ["tabular-nums"],
  },
});

const baseCard: ViewStyle = {
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: RADIUS["2xl"],
  padding: SPACING.lg,
  overflow: "hidden",
};

export const layout = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenPadded: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  scrollContent: {
    paddingBottom: SPACING["5xl"] + 24,
    gap: SPACING.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stack: {
    gap: SPACING.lg,
  },
  stackSm: {
    gap: SPACING.md,
  },
  section: {
    marginBottom: SPACING["2xl"],
  },
});

export const cards = StyleSheet.create({
  base: baseCard,
  elevated: {
    ...baseCard,
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderStrong,
    shadowColor: "#1a1209",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  glow: {
    ...baseCard,
    borderColor: colors.borderStrong,
    shadowColor: colors.walnut,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  inset: {
    backgroundColor: "rgba(26, 18, 9, 0.5)",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
});

export const borders = StyleSheet.create({
  hairline: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  default: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  strong: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  dashed: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
});

export const buttons = StyleSheet.create({
  primary: {
    backgroundColor: colors.camel,
    paddingVertical: 14,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.xl,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 237, 216, 0.12)",
  },
  primaryText: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    color: colors.antiqueWhite,
    fontWeight: "400",
  },
  secondary: {
    backgroundColor: colors.accentMuted,
    paddingVertical: 14,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryText: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    color: colors.text,
  },
  ghost: {
    paddingVertical: 12,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "transparent",
  },
  ghostText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    color: colors.textMuted,
  },
  danger: {
    backgroundColor: colors.negativeMuted,
    paddingVertical: 14,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(139, 94, 52, 0.35)",
  },
  dangerText: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    color: colors.softApricot,
  },
});

export const inputs = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    color: colors.text,
    backgroundColor: "rgba(26, 18, 9, 0.6)",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: RADIUS.xl,
  },
  search: {
    minHeight: 48,
    paddingLeft: 44,
    paddingRight: SPACING.lg,
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: RADIUS.xl,
  },
});

export const chips = StyleSheet.create({
  base: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "transparent",
  },
  active: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.borderStrong,
  },
  text: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    color: colors.textMuted,
  },
  textActive: {
    color: colors.accent,
  },
});

export const stats = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  cell: {
    flex: 1,
    minWidth: "45%",
    padding: SPACING.md,
    backgroundColor: "rgba(88, 49, 1, 0.15)",
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: "rgba(255, 237, 216, 0.06)",
  },
  value: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    color: colors.text,
    fontVariant: ["tabular-nums"],
  },
  label: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    color: colors.textFaint,
    marginTop: 4,
  },
});

export const tabBar = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 88,
    paddingBottom: 28,
    paddingTop: SPACING.sm,
  },
  active: {
    color: colors.accent,
  },
  inactive: {
    color: colors.textMuted,
  },
});

export const list = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255, 237, 216, 0.06)",
  },
});

export const header = StyleSheet.create({
  page: {
    marginBottom: SPACING["2xl"],
  },
  title: {
    ...typography.h1,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.textMuted,
  },
});

/** Positive / negative text helpers */
export function movementStyle(value: number): TextStyle {
  return { color: value >= 0 ? colors.positive : colors.negative };
}

export function movementColor(value: number): string {
  return value >= 0 ? colors.positive : colors.negative;
}

/** Legacy theme object — maps old success/loss to walnut palette */
export const theme = {
  ...AUXANO_THEME,
  /** @deprecated use `positive` */
  success: AUXANO_THEME.positive,
  loss: AUXANO_THEME.negative,
};
