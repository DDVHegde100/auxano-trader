export {
  colors,
  typography,
  layout,
  cards,
  borders,
  buttons,
  inputs,
  chips,
  stats,
  tabBar,
  list,
  header,
  movementStyle,
  movementColor,
  theme,
  fontFamily,
} from "@/src/styles/design-system";

export { AUXANO_THEME, PALETTE, SPACING, RADIUS, FONT_FAMILY } from "@auxano/shared";

import { AUXANO_THEME } from "@auxano/shared";

export const styles = {
  bg: { backgroundColor: AUXANO_THEME.background },
  surface: { backgroundColor: AUXANO_THEME.surface },
  text: { color: AUXANO_THEME.textPrimary },
  muted: { color: AUXANO_THEME.textMuted },
  card: {
    backgroundColor: AUXANO_THEME.card,
    borderWidth: 1,
    borderColor: AUXANO_THEME.border,
    borderRadius: 16,
  },
  gain: { color: AUXANO_THEME.positive },
  loss: { color: AUXANO_THEME.negative },
};
