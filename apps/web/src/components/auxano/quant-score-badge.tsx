import { cn } from "@/lib/utils";

const tiers = {
  low: "from-[rgba(139,94,52,0.25)] to-[rgba(42,26,14,0.4)] text-[var(--tan)]",
  mid: "from-[rgba(164,113,72,0.3)] to-[rgba(42,26,14,0.4)] text-[var(--camel)]",
  high: "from-[rgba(188,138,95,0.35)] to-[rgba(42,26,14,0.4)] text-[var(--light-bronze)]",
  elite: "from-[rgba(212,162,118,0.4)] to-[rgba(88,49,1,0.3)] text-[var(--antique-white)]",
};

export function QuantScoreBadge({
  score,
  size = "md",
}: {
  score: number;
  size?: "sm" | "md" | "lg";
}) {
  const tier =
    score >= 800 ? "elite" : score >= 600 ? "high" : score >= 400 ? "mid" : "low";
  const dim =
    size === "lg" ? "h-20 w-20 text-2xl" : size === "sm" ? "h-12 w-12 text-sm" : "h-16 w-16 text-lg";

  return (
    <div
      className={cn(
        "flex shrink-0 flex-col items-center justify-center rounded-2xl border border-[var(--border-strong)] bg-gradient-to-br font-normal tabular-nums",
        tiers[tier],
        dim
      )}
    >
      <span>{score}</span>
      <span className="text-[10px] uppercase tracking-wide opacity-70">Quant</span>
    </div>
  );
}
