"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/auxano/glass-card";
import { QuantScoreBadge } from "@/components/auxano/quant-score-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { Trophy } from "lucide-react";

export default function LeaderboardPage() {
  const [data, setData] = useState<{
    topStrategies: { id: string; name: string; slug: string; quantScore: number }[];
    topCreators: { name: string; username: string; score: number; strategyCount: number }[];
    topTraders: { user: { name: string }; portfolioValue: number; returnPct: number }[];
  } | null>(null);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Trophy className="h-8 w-8 text-[#C7C7C7]" />
        <div>
          <h1 className="text-3xl font-semibold">Leaderboards</h1>
          <p className="text-[#B0B0B0]">Top strategies, creators, and traders</p>
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Top Strategies</h2>
        <div className="space-y-3">
          {data.topStrategies.map((s, i) => (
            <Link key={s.id} href={`/strategies/${s.slug}`}>
              <GlassCard className="flex items-center gap-4 !py-3">
                <span className="w-8 text-2xl font-bold text-[#B0B0B0]/40">
                  {i + 1}
                </span>
                <QuantScoreBadge score={s.quantScore} size="sm" />
                <span className="flex-1 font-medium">{s.name}</span>
              </GlassCard>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Top Creators</h2>
        <div className="space-y-3">
          {data.topCreators.map((c, i) => (
            <GlassCard key={c.username ?? i} className="flex items-center gap-4 !py-3">
              <span className="w-8 text-2xl font-bold text-[#B0B0B0]/40">{i + 1}</span>
              <div className="flex-1">
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-[#B0B0B0]">
                  {c.strategyCount} strategies · score {c.score}
                </p>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Top Paper Traders</h2>
        <div className="space-y-3">
          {data.topTraders.map((t, i) => (
            <GlassCard key={i} className="flex items-center gap-4 !py-3">
              <span className="w-8 text-2xl font-bold text-[#B0B0B0]/40">{i + 1}</span>
              <div className="flex-1">
                <p className="font-medium">{t.user.name}</p>
                <p className="text-xs text-[#B0B0B0]">
                  {formatCurrency(t.portfolioValue)}
                </p>
              </div>
              <span className={t.returnPct >= 0 ? "text-gain" : "text-loss"}>
                {formatPercent(t.returnPct)}
              </span>
            </GlassCard>
          ))}
        </div>
      </section>
    </div>
  );
}
