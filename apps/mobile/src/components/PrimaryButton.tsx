import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle } from "react-native";
import { theme } from "@/src/lib/theme";

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
  variant?: "primary" | "success" | "danger" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const bg =
    variant === "success"
      ? "rgba(0,200,83,0.25)"
      : variant === "danger"
        ? "rgba(255,82,82,0.25)"
        : variant === "ghost"
          ? "transparent"
          : theme.textPrimary;

  const textColor =
    variant === "primary" ? theme.background : variant === "ghost" ? theme.textSecondary : theme.textPrimary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, opacity: pressed ? 0.85 : disabled ? 0.5 : 1 },
        variant === "ghost" && styles.ghost,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 14, alignItems: "center" },
  ghost: { borderWidth: 1, borderColor: theme.border },
  text: { fontWeight: "600", fontSize: 15 },
});
