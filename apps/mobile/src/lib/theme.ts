import { AUXANO_THEME } from "@auxano/shared";

export const theme = AUXANO_THEME;

export const styles = {
  bg: { backgroundColor: theme.background },
  surface: { backgroundColor: theme.surface },
  text: { color: theme.textPrimary },
  muted: { color: theme.textSecondary },
  card: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 16,
  },
  gain: { color: theme.success },
  loss: { color: theme.loss },
};
