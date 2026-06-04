export { AUXANO_THEME, FONT_FAMILY, PALETTE, SPACING, RADIUS } from "@auxano/shared";

/** Import in Next.js globals.css:
 * @import "../../../packages/ui/src/tokens.css";
 * @import "../../../packages/ui/src/auxano-system.css";
 */
export const DESIGN_SYSTEM_PATH = {
  tokens: "./tokens.css",
  system: "./auxano-system.css",
} as const;
