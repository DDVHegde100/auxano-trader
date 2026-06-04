export function formatUsd(n: number, compact = false) {
  if (compact) {
    if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
    if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatPct(n: number, digits = 2) {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}%`;
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
