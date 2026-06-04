import { View } from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";
import { theme } from "@/src/lib/theme";

export function MiniChart({
  data,
  height = 80,
  positive,
}: {
  data: number[];
  height?: number;
  positive?: boolean;
}) {
  if (!data.length) return <View style={{ height }} />;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 280;
  const step = w / (data.length - 1 || 1);

  const points = data.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * (height - 8) - 4;
    return `${i === 0 ? "M" : "L"}${x},${y}`;
  });

  const path = points.join(" ");
  const stroke = positive === false ? theme.loss : theme.success;

  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`}>
      <Defs>
        <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <Stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d={`${path} L${w},${height} L0,${height} Z`} fill="url(#grad)" />
      <Path d={path} stroke={stroke} strokeWidth={2} fill="none" />
    </Svg>
  );
}
