import { Image, StyleSheet, ViewStyle } from "react-native";

const icon = require("../../assets/icon.png");

type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, number> = { sm: 40, md: 56, lg: 80 };

export function BrandLogo({
  size = "md",
  style,
}: {
  size?: Size;
  style?: ViewStyle;
}) {
  const dim = SIZES[size];
  return (
    <Image
      source={icon}
      style={[styles.logo, { width: dim, height: dim, borderRadius: dim * 0.22 }, style]}
      resizeMode="cover"
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    alignSelf: "center",
  },
});
