"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/auxano/glass-card";
import { QuantScoreBadge } from "@/components/auxano/quant-score-badge";
import { PerformanceChart } from "@/components/auxano/performance-chart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPercent } from "@/lib/utils";
import { Heart, UserPlus, MessageCircle } from "lucide-react";

export default function StrategyDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [comment, setComment] = useState("");
  const [tab, setTab] = useState<"overview" | "performance" | "comments">("overview");

  useEffect(() => {
    fetch(`/api/strategies/${slug}`)
      .then((r) => r.json())
      .then(setData);
  }, [slug]);

  async function toggleFollow() {
    await fetch(`/api/strategies/${slug}/follow`, { method: "POST" });
    const d = await fetch(`/api/strategies/${slug}`).then((r) => r.json());
    setData(d);
  }

  async function toggleLike() {
    await fetch(`/api/strategies/${slug}/like`, { method: "POST" });
    const d = await fetch(`/api/strategies/${slug}`).then((r) => r.json());
    setData(d);
  }

  async function postComment() {
    if (!comment.trim()) return;
    await fetch(`/api/strategies/${slug}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: comment }),
    });
    setComment("");
    const d = await fetch(`/api/strategies/${slug}`).then((r) => r.json());
    setData(d);
  }

  if (!data) return <Skeleton className="h-96 w-full" />;

  const backtest = (data.backtests as { result?: { equityCurve: unknown[] } }[])?.[0];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-6">
        <QuantScoreBadge score={data.quantScore as number} size="lg" />
        <div className="flex-1">
          <h1 className="text-3xl font-semibold">{data.name as string}</h1>
          <p className="text-[#B0B0B0]">
            by {(data.creator as { name: string }).name} · {data.category as string}
          </p>
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" size="sm" onClick={toggleFollow}>
              <UserPlus className="h-4 w-4" />
              {data.isFollowing ? "Following" : "Follow"}
            </Button>
            <Button variant="secondary" size="sm" onClick={toggleLike}>
              <Heart className="h-4 w-4" />
              {data.isLiked ? "Liked" : "Like"}
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="flex gap-2 border-b border-white/[0.08]">
        {(["overview", "performance", "comments"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm capitalize ${
              tab === t
                ? "border-b-2 border-[#00C853] text-[#F5F5F5]"
                : "text-[#B0B0B0]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <GlassCard>
          <p className="leading-relaxed text-[#B0B0B0]">{data.description as string}</p>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { l: "Return", v: formatPercent(data.historicalReturn as number) },
              { l: "Sharpe", v: (data.sharpeRatio as number)?.toFixed(2) },
              { l: "Win Rate", v: `${(data.winRate as number)?.toFixed(0)}%` },
              { l: "Max DD", v: `${(data.maxDrawdown as number)?.toFixed(1)}%` },
            ].map((m) => (
              <div key={m.l} className="rounded-xl bg-white/[0.04] p-3 text-center">
                <p className="text-lg font-semibold">{m.v}</p>
                <p className="text-xs text-[#B0B0B0]">{m.l}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {tab === "performance" && backtest?.result && (
        <GlassCard>
          <h3 className="mb-4 font-semibold">Equity Curve</h3>
          <PerformanceChart
            data={
              backtest.result.equityCurve as { date: string; value: number }[]
            }
          />
        </GlassCard>
      )}

      {tab === "comments" && (
        <GlassCard>
          <div className="mb-4 flex gap-2">
            <Input
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <Button onClick={postComment}>
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-4">
            {(
              data.comments as {
                id: string;
                content: string;
                user: { name: string };
                createdAt: string;
              }[]
            )?.map((c) => (
              <div key={c.id} className="border-b border-white/[0.06] pb-3">
                <p className="text-sm font-medium">{c.user.name}</p>
                <p className="text-[#B0B0B0]">{c.content}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
