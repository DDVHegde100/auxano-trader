"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/auxano/glass-card";
import { QuantScoreBadge } from "@/components/auxano/quant-score-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { MarketplaceStrategy } from "@auxano/shared";
import { formatPercent } from "@/lib/utils";
import { Search, TrendingUp, Check } from "lucide-react";
import { setSelectedPresetInStorage } from "@/lib/services/preset-trade";

type DefaultAlgo = MarketplaceStrategy & {
  isPreset: true;
  isDefault: true;
  tagline?: string;
  backtestSymbol?: string;
  backtestDays?: number;
  allowedSymbols?: string[];
  symbolScope?: string;
};

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
  const router = useRouter();
  const [defaults, setDefaults] = useState<DefaultAlgo[]>([]);
  const [community, setCommunity] = useState<MarketplaceStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== "ALL") params.set("category", category);
    if (search) params.set("search", search);

    Promise.all([
      fetch("/api/algorithms/presets").then((r) => r.json()),
      fetch(`/api/strategies?${params}`).then((r) => r.json()),
    ])
      .then(([presetData, stratData]) => {
        setDefaults(
          (presetData.presets ?? []).map((p: DefaultAlgo) => ({
            ...p,
            isPreset: true,
            isDefault: true,
            creator: {
              id: "default",
              name: "DEFAULT",
              username: "default",
              avatarUrl: null,
            },
          }))
        );
        setCommunity(stratData.strategies ?? []);
      })
      .finally(() => setLoading(false));
  }, [category, search]);

  const filteredDefaults = useMemo(() => {
    return defaults.filter((d) => {
      if (category !== "ALL" && d.category !== category) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          d.name.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [defaults, category, search]);

  function addToTrading(preset: DefaultAlgo) {
    setSelectedPresetInStorage(preset.id);
    setSelectedId(preset.id);
    setToast(`${preset.name} added to Trade — pick an allowed symbol there.`);
    setTimeout(() => setToast(null), 4000);
    router.push(`/trade?preset=${preset.id}`);
  }

  return (
    <div className="aux-stack">
      <header className="aux-section-header">
        <h1 className="aux-h1">Algorithm Marketplace</h1>
        <p>
          Six DEFAULT algorithms with 1-year backtests · tap to add to paper trading
        </p>
      </header>

      {toast && (
        <div className="aux-pill flex items-center gap-2 border border-[var(--border-strong)] bg-[var(--accent-muted)]">
          <Check className="h-4 w-4 text-accent" />
          <span className="text-sm text-foreground">{toast}</span>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          className="pl-11"
          placeholder="Search algorithms..."
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
            className={`aux-chip ${category === f ? "aux-chip-active" : ""}`}
          >
            {f.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="aux-grid-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      ) : (
        <>
          <section>
            <h2 className="aux-overline mb-4">Built-in · DEFAULT</h2>
            <div className="aux-grid-2">
              {filteredDefaults.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <GlassCard
                    className={`h-full ${selectedId === p.id ? "aux-card-glow" : ""}`}
                    interactive
                  >
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => addToTrading(p)}
                    >
                      <div className="flex gap-4">
                        <QuantScoreBadge score={p.quantScore} size="md" />
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate aux-h4">{p.name}</h3>
                          <p className="text-xs font-normal uppercase tracking-wide text-accent">
                            DEFAULT · 1Y backtest on {p.backtestSymbol ?? "—"}
                          </p>
                          <p className="mt-1 text-xs text-muted">{p.tagline}</p>
                          <p className="mt-2 line-clamp-2 aux-caption">
                            {p.description}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                        <div className="aux-stat aux-stat-positive">
                          <p className="aux-stat-value text-positive">
                            +{p.historicalReturn?.toFixed(1) ?? "—"}%
                          </p>
                          <p className="aux-stat-label">ann. return</p>
                        </div>
                        <div className="aux-stat">
                          <p className="aux-stat-value">
                            {p.sharpeRatio?.toFixed(2) ?? "—"}
                          </p>
                          <p className="aux-stat-label">Sharpe</p>
                        </div>
                        <div className="aux-stat">
                          <p className="aux-stat-value">
                            {p.winRate?.toFixed(0) ?? "—"}%
                          </p>
                          <p className="aux-stat-label">win rate</p>
                        </div>
                        <div className="aux-stat aux-stat-negative">
                          <p className="aux-stat-value">
                            −{p.maxDrawdown?.toFixed(1) ?? "—"}%
                          </p>
                          <p className="aux-stat-label">max DD</p>
                        </div>
                      </div>
                      <p className="mt-3 aux-caption">
                        {p.symbolScope === "universal"
                          ? "Trades any NASDAQ symbol you select"
                          : `Assets: ${(p.allowedSymbols ?? []).join(", ")}`}
                      </p>
                    </button>
                    <Button
                      variant="primary"
                      size="sm"
                      className="mt-4 w-full"
                      onClick={() => addToTrading(p)}
                    >
                      <TrendingUp className="h-4 w-4" />
                      Add to trading
                    </Button>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </section>

          {community.length > 0 && (
            <section className="mt-10">
              <h2 className="aux-overline mb-4">Community strategies</h2>
              <div className="aux-grid-2">
                {community.map((s) => (
                  <GlassCard key={s.id} className="h-full opacity-90">
                    <h3 className="aux-h4">{s.name}</h3>
                    <p className="text-xs text-muted">
                      @{s.creator.username ?? s.creator.name}
                    </p>
                    <p className="mt-2 aux-caption line-clamp-2">{s.description}</p>
                    <div className="mt-3 text-sm text-positive">
                      {s.historicalReturn != null
                        ? formatPercent(s.historicalReturn)
                        : "—"}{" "}
                      ann. return
                    </div>
                  </GlassCard>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
