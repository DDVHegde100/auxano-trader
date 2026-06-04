/**
 * Composed mobile component styles — use with design-system tokens
 */

import { StyleSheet, type TextStyle, type ViewStyle } from "react-native";
import {
  colors,
  fontFamily,
  SPACING,
  RADIUS,
  typography,
} from "./design-system";

export const screen = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  padded: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: SPACING.lg,
  },
  scroll: {
    paddingBottom: 120,
    gap: SPACING.lg,
  },
});

export const pageHeader = StyleSheet.create({
  wrap: {
    marginBottom: SPACING["2xl"],
    paddingTop: SPACING.sm,
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

export const metricRow = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: SPACING.lg,
  },
  label: {
    ...typography.caption,
  },
  value: {
    ...typography.display,
    fontSize: 36,
    lineHeight: 40,
    color: colors.text,
  },
  change: {
    ...typography.bodySm,
    marginTop: SPACING.xs,
  },
});

export const symbolChip = StyleSheet.create({
  wrap: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: SPACING.sm,
  },
  active: {
    borderColor: colors.borderStrong,
    backgroundColor: colors.accentMuted,
  },
  text: {
    fontFamily,
    fontSize: 13,
    color: colors.textMuted,
  },
  textActive: {
    color: colors.accent,
  },
});

export const tradePanel = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: RADIUS["2xl"],
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  price: {
    fontFamily,
    fontSize: 40,
    lineHeight: 44,
    color: colors.lightBronze,
    fontVariant: ["tabular-nums"],
  },
  label: {
    fontFamily,
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: SPACING.sm,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    fontFamily,
    fontSize: 16,
    color: colors.text,
    backgroundColor: "rgba(26, 18, 9, 0.5)",
    marginTop: SPACING.sm,
  },
});

export const modal = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(26, 18, 9, 0.8)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: RADIUS["2xl"],
    borderTopRightRadius: RADIUS["2xl"],
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: SPACING.lg,
    paddingBottom: SPACING["4xl"],
    maxHeight: "85%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    alignSelf: "center",
    marginBottom: SPACING.lg,
  },
});

export function pillStyle(active: boolean): ViewStyle {
  return {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: active ? colors.borderStrong : colors.border,
    backgroundColor: active ? colors.accentMuted : "transparent",
  };
}

export function pillTextStyle(active: boolean): TextStyle {
  return {
    fontFamily,
    fontSize: 12,
    color: active ? colors.accent : colors.textMuted,
  };
}
