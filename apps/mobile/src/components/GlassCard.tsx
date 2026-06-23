import { View, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { cards } from "@/src/styles/design-system";

export function GlassCard({
  children,
  style,
  glow,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  glow?: boolean;
}) {
  return (
    <View style={[glow ? cards.glow : cards.elevated, style]}>{children}</View>
  );
}
