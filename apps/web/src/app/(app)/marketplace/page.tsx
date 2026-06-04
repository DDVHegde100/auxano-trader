"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/auxano/glass-card";
import { QuantScoreBadge } from "@/components/auxano/quant-score-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import type { MarketplaceStrategy } from "@auxano/shared";
import { formatPercent } from "@/lib/utils";
import { Search, Heart } from "lucide-react";

const FILTERS = [
  "ALL",
  "CONSERVATIVE",
  "BALANCED",
  "AGGRESSIVE",
  "MOMENTUM",
  "MEAN_REVERSION",
  "GROWTH",
  "VALUE",
];

export default function MarketplacePage() {
  const [strategies, setStrategies] = useState<MarketplaceStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== "ALL") params.set("category", category);
    if (search) params.set("search", search);
    fetch(`/api/strategies?${params}`)
      .then((r) => r.json())
      .then((d) => setStrategies(d.strategies ?? []))
      .finally(() => setLoading(false));
  }, [category, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Algorithm Marketplace</h1>
        <p className="text-[#B0B0B0]">
          Discover, follow, and simulate quantitative strategies
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B0B0B0]" />
        <Input
          className="pl-11"
          placeholder="Search strategies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setCategory(f)}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium transition-all ${
              category === f
                ? "border-[#00C853]/40 bg-[#00C853]/15 text-[#00C853]"
                : "border-white/[0.08] text-[#B0B0B0] hover:bg-white/[0.04]"
            }`}
          >
            {f.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {strategies.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link href={`/strategies/${s.slug}`}>
                <GlassCard className="h-full cursor-pointer transition-transform hover:scale-[1.01]">
                  <div className="flex gap-4">
                    <QuantScoreBadge score={s.quantScore} size="md" />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold">{s.name}</h3>
                      <p className="text-xs text-[#B0B0B0]">
                        @{s.creator.username ?? s.creator.name}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm text-[#B0B0B0]">
                        {s.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3 text-xs">
                    <span className="text-gain">
                      {s.historicalReturn != null
                        ? formatPercent(s.historicalReturn)
                        : "—"}{" "}
                      return
                    </span>
                    <span className="text-[#B0B0B0]">
                      Sharpe {s.sharpeRatio?.toFixed(2) ?? "—"}
                    </span>
                    <span className="text-[#B0B0B0]">
                      WR {s.winRate?.toFixed(0) ?? "—"}%
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-[#B0B0B0]">
                    <span>{s.followerCount} followers</span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" /> {s.likeCount}
                    </span>
                    <span className="rounded-md border border-white/[0.08] px-2 py-0.5">
                      {s.riskRating}
                    </span>
                  </div>
                </GlassCard>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
