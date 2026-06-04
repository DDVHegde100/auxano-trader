import Svg, { Path } from "react-native-svg";
import { colors } from "@/src/styles/design-system";

export function MiniChart({
  data,
  width = 120,
  height = 40,
  positive,
}: {
  data: number[];
  width?: number;
  height?: number;
  positive?: boolean;
}) {
  if (!data.length) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);

  const points = data
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * height;
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  const stroke =
    positive === false ? colors.negative : colors.positive;

  return (
    <Svg width={width} height={height}>
      <Path d={points} fill="none" stroke={stroke} strokeWidth={2} />
    </Svg>
  );
}
