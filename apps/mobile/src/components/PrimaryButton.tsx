import {
  Pressable,
  Text,
  ActivityIndicator,
  ViewStyle,
  StyleSheet,
} from "react-native";
import { buttons } from "@/src/styles/design-system";
import { colors } from "@/src/styles/design-system";

export function PrimaryButton({
  label,
  onPress,
  variant = "primary",
  loading,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "accent";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const btnStyle =
    variant === "secondary"
      ? buttons.secondary
      : variant === "danger"
        ? buttons.danger
        : variant === "ghost"
          ? buttons.ghost
          : buttons.primary;

  const textStyle =
    variant === "secondary"
      ? buttons.secondaryText
      : variant === "danger"
        ? buttons.dangerText
        : variant === "ghost"
          ? buttons.ghostText
          : buttons.primaryText;

  const spinnerColor =
    variant === "primary" ? colors.antiqueWhite : colors.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        btnStyle,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <Text style={textStyle}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.45 },
});
