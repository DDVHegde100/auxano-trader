"use client";

import { useEffect, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface SearchQuote {
  symbol: string;
  name: string;
  type: string;
  exchange: string;
}

export function StockSearch({
  onSelect,
  className,
}: {
  onSelect: (item: SearchQuote) => void;
  className?: string;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchQuote[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (q.length < 1) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/market/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data.results ?? []);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      {loading && (
        <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-accent" />
      )}
      <Input
        className="pl-11"
        placeholder="Search stocks, ETFs, indices (e.g. NVDA, SPY)…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
      />
      {open && results.length > 0 && (
        <ul className="aux-dropdown absolute z-50 mt-2 max-h-64 w-full overflow-auto">
          {results.map((r) => (
            <li key={r.symbol}>
              <button
                type="button"
                className="aux-dropdown-item"
                onClick={() => {
                  onSelect(r);
                  setQ(r.symbol);
                  setOpen(false);
                }}
              >
                <span>
                  <span className="font-normal text-foreground">{r.symbol}</span>
                  <span className="ml-2 text-sm text-muted">{r.name}</span>
                </span>
                <span className="text-xs text-accent">{r.exchange}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
