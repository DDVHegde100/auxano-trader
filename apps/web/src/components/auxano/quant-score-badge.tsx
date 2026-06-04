"use client";

import { cn } from "@/lib/utils";

export function QuantScoreBadge({
  score,
  size = "md",
}: {
  score: number;
  size?: "sm" | "md" | "lg";
}) {
  const tier =
    score >= 800 ? "elite" : score >= 600 ? "pro" : score >= 400 ? "solid" : "developing";
  const colors = {
    elite: "from-[#00C853]/30 to-[#C7C7C7]/20 text-[#00C853]",
    pro: "from-[#4FC3F7]/30 to-[#C7C7C7]/20 text-[#4FC3F7]",
    solid: "from-[#FFB74D]/30 to-[#C7C7C7]/20 text-[#FFB74D]",
    developing: "from-white/10 to-white/5 text-[#B0B0B0]",
  };

  const sizes = {
    sm: "h-10 w-10 text-xs",
    md: "h-14 w-14 text-sm",
    lg: "h-20 w-20 text-lg",
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-gradient-to-br font-bold tabular-nums",
        colors[tier],
        sizes[size]
      )}
    >
      <span className="text-[10px] font-medium uppercase tracking-widest opacity-70">
        Quant
      </span>
      <span>{score}</span>
    </div>
  );
}
