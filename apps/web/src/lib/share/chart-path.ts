export type ChartPoint = { date: string; value: number };

/** Normalize series to 0–100 for compact SVG charts. */
export function normalizeSeries(values: number[]): number[] {
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values.map((v) => ((v - min) / range) * 100);
}

export function seriesToSvgPath(
  values: number[],
  width: number,
  height: number,
  padding = 8
): string {
  if (values.length < 2) return "";
  const w = width - padding * 2;
  const h = height - padding * 2;
  const normalized = normalizeSeries(values);
  return normalized
    .map((v, i) => {
      const x = padding + (i / (normalized.length - 1)) * w;
      const y = padding + h - (v / 100) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function periodReturnPct(curve: ChartPoint[]): number {
  if (curve.length < 2) return 0;
  const first = curve[0].value;
  const last = curve[curve.length - 1].value;
  if (first <= 0) return 0;
  return ((last - first) / first) * 100;
}
