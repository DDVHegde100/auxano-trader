"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Info,
  Blocks,
  Code2,
  Copy,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BLOCK_CATALOG,
  getBlockInfo,
  blocksToPython,
  PYTHON_STRATEGY_STARTER,
  logicWithMeta,
  type StrategyLogic,
  type StrategyNode,
  type StrategyMeta,
} from "@auxano/shared";

let nodeId = 1;

export type StrategyVisibilityChoice = "PUBLIC" | "FRIENDS" | "PRIVATE";

export function StrategyBuilder({
  onSave,
  initial,
}: {
  onSave: (
    logic: StrategyLogic,
    meta: {
      name: string;
      description: string;
      visibility: StrategyVisibilityChoice;
    }
  ) => void;
  initial?: StrategyLogic;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<StrategyVisibilityChoice>("PUBLIC");
  const [mode, setMode] = useState<"blocks" | "code">(
    initial?.meta?.builderMode ?? "blocks"
  );
  const [nodes, setNodes] = useState<StrategyNode[]>(initial?.nodes ?? []);
  const [pythonCode, setPythonCode] = useState(
    initial?.meta?.pythonCode ?? PYTHON_STRATEGY_STARTER
  );
  const [symbolScope, setSymbolScope] = useState<StrategyMeta["symbolScope"]>(
    initial?.meta?.symbolScope ?? "universal"
  );
  const [symbols, setSymbols] = useState(
    (initial?.meta?.symbols ?? []).join(", ")
  );
  const [infoBlock, setInfoBlock] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generatedPython = useMemo(
    () => blocksToPython({ nodes, edges: [] }),
    [nodes]
  );

  function addBlock(template: (typeof BLOCK_CATALOG)[0]) {
    const id = `node-${nodeId++}`;
    setNodes([
      ...nodes,
      {
        id,
        type: "condition",
        label: template.label,
        data: { ...template.defaultData },
        position: { x: 0, y: nodes.length * 88 },
      },
    ]);
  }

  function updateNodeData(id: string, key: string, value: string | number) {
    setNodes(
      nodes.map((n) =>
        n.id === id
          ? { ...n, data: { ...n.data, [key]: value } }
          : n
      )
    );
  }

  function removeNode(id: string) {
    setNodes(nodes.filter((n) => n.id !== id));
  }

  function syncBlocksToCode() {
    setPythonCode(blocksToPython({ nodes, edges: [] }));
    setMode("code");
  }

  function buildLogic(): StrategyLogic {
    const meta: StrategyMeta = {
      symbolScope,
      symbols:
        symbolScope === "symbols"
          ? symbols
              .split(/[,\s]+/)
              .map((s) => s.trim().toUpperCase())
              .filter(Boolean)
          : [],
      assetTypes: ["STOCK", "ETF", "INDEX", "OPTION", "FUTURE"],
      builderMode: mode,
      pythonCode: mode === "code" ? pythonCode : generatedPython,
    };
    return logicWithMeta(nodes, [], meta);
  }

  function handleSave() {
    if (!name.trim()) return;
    onSave(buildLogic(), { name, description, visibility });
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <input
          className="flex h-11 rounded-xl border border-[var(--border-default)] bg-black/30 px-4 text-sm"
          placeholder="Strategy name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="flex h-11 rounded-xl border border-[var(--border-default)] bg-black/30 px-4 text-sm"
          placeholder="Short description for marketplace"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--accent-muted)] p-4">
        <p className="text-sm font-medium">Symbol scope</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["universal", "symbols"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSymbolScope(s)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium ${
                symbolScope === s
                  ? "bg-[var(--accent-muted)] text-accent border border-[var(--border-default)]"
                  : "border border-white/10 text-muted"
              }`}
            >
              {s === "universal" ? "Any NASDAQ asset" : "Specific symbols only"}
            </button>
          ))}
        </div>
        {symbolScope === "symbols" && (
          <input
            className="mt-3 w-full rounded-xl border border-[var(--border-default)] bg-black/30 px-4 py-2 text-sm"
            placeholder="AAPL, NVDA, SPY"
            value={symbols}
            onChange={(e) => setSymbols(e.target.value)}
          />
        )}
      </div>

      <div className="flex gap-2 border-b border-[var(--border-default)] pb-2">
        <button
          type="button"
          onClick={() => setMode("blocks")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm ${
            mode === "blocks" ? "bg-[var(--accent-muted)] text-accent" : "text-muted"
          }`}
        >
          <Blocks className="h-4 w-4" />
          Block builder
        </button>
        <button
          type="button"
          onClick={() => setMode("code")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm ${
            mode === "code" ? "bg-[var(--accent-muted)] text-accent" : "text-muted"
          }`}
        >
          <Code2 className="h-4 w-4" />
          Python
        </button>
      </div>

      <AnimatePresence mode="wait">
        {mode === "blocks" ? (
          <motion.div
            key="blocks"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div>
              <p className="mb-2 text-sm text-muted">
                Tap blocks to add · adjust parameters ·{" "}
                <span className="text-accent">ⓘ</span> for beginner help
              </p>
              <div className="flex flex-wrap gap-2">
                {BLOCK_CATALOG.map((t) => (
                  <Button
                    key={t.id}
                    variant="secondary"
                    size="sm"
                    onClick={() => addBlock(t)}
                  >
                    <Plus className="h-3 w-3" />
                    {t.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="min-h-[280px] space-y-3 rounded-2xl border border-dashed border-[var(--border-default)] bg-black/20 p-4">
              {nodes.length === 0 ? (
                <p className="flex h-48 items-center justify-center text-muted">
                  Add blocks to define your algorithm
                </p>
              ) : (
                nodes.map((node) => (
                  <div
                    key={node.id}
                    className="rounded-xl border border-[var(--border-default)] bg-surface-elevated p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-accent" />
                        <span className="font-medium">{node.label}</span>
                        <button
                          type="button"
                          className="text-accent hover:text-secondary"
                          onClick={() =>
                            setInfoBlock(
                              getBlockInfo(String(node.data.indicator))
                            )
                          }
                          aria-label="Block info"
                        >
                          <Info className="h-4 w-4" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeNode(node.id)}
                        className="text-muted hover:text-loss"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {node.data.threshold != null && (
                      <label className="mt-3 block text-xs text-muted">
                        Threshold
                        <input
                          type="number"
                          className="mt-1 w-full rounded-lg border border-[var(--border-default)] bg-black/40 px-3 py-2 text-sm"
                          value={Number(node.data.threshold)}
                          onChange={(e) =>
                            updateNodeData(node.id, "threshold", Number(e.target.value))
                          }
                        />
                      </label>
                    )}
                  </div>
                ))
              )}
            </div>

            <Button variant="secondary" onClick={syncBlocksToCode}>
              <Code2 className="h-4 w-4" />
              Export blocks → Python (one-way)
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="code"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            <p className="text-xs text-muted">
              Python mode cannot convert back to blocks. Backtests still use block
              logic if you have blocks saved; publish after exporting from blocks
              or rebuild blocks manually.
            </p>
            <textarea
              className="min-h-[320px] w-full rounded-2xl border border-[var(--border-default)] bg-black/50 p-4 font-mono text-sm text-[#e8e4dc]"
              value={pythonCode}
              onChange={(e) => setPythonCode(e.target.value)}
              spellCheck={false}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(pythonCode);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              <Copy className="h-4 w-4" />
              {copied ? "Copied" : "Copy code"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="rounded-xl border border-[var(--border-default)] bg-black/20 p-4">
        <p className="text-sm font-medium">Who can see this strategy?</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {(
            [
              {
                id: "PUBLIC" as const,
                title: "Public",
                desc: "Listed in community marketplace",
              },
              {
                id: "FRIENDS" as const,
                title: "Friends only",
                desc: "Visible to mutual friends on your profile",
              },
              {
                id: "PRIVATE" as const,
                title: "Private",
                desc: "Only you — still usable in Trade & Bots",
              },
            ] as const
          ).map((opt) => (
            <label
              key={opt.id}
              className={`flex flex-1 cursor-pointer flex-col rounded-xl border px-4 py-3 transition-colors ${
                visibility === opt.id
                  ? "border-[var(--camel)] bg-[var(--camel)]/10"
                  : "border-white/10 hover:border-white/20"
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="radio"
                  name="visibility"
                  checked={visibility === opt.id}
                  onChange={() => setVisibility(opt.id)}
                  className="h-4 w-4"
                />
                {opt.title}
              </span>
              <span className="mt-1 pl-6 text-xs text-[var(--foreground-muted)]">
                {opt.desc}
              </span>
            </label>
          ))}
        </div>
      </div>

      {infoBlock && (
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--accent-muted)] p-4 text-sm text-foreground">
          <button
            type="button"
            className="float-right text-muted"
            onClick={() => setInfoBlock(null)}
          >
            ×
          </button>
          {infoBlock}
        </div>
      )}

      <Button variant="primary" size="lg" className="w-full" onClick={handleSave}>
        Run backtest & publish to marketplace
      </Button>
    </div>
  );
}
