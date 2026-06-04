"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StrategyLogic, StrategyNode } from "@auxano/shared";

const BLOCK_TEMPLATES = [
  {
    label: "RSI Oversold Buy",
    data: { indicator: "RSI", operator: "<", threshold: 30, action: "BUY" },
  },
  {
    label: "RSI Overbought Sell",
    data: { indicator: "RSI", operator: ">", threshold: 70, action: "SELL" },
  },
  {
    label: "Golden Cross Buy",
    data: { indicator: "MA_CROSS", operator: ">", action: "BUY" },
  },
  {
    label: "Take Profit 15%",
    data: { indicator: "PROFIT", operator: ">", threshold: 15, action: "SELL" },
  },
];

let nodeId = 1;

export function StrategyBuilder({
  onSave,
  initial,
}: {
  onSave: (logic: StrategyLogic, meta: { name: string; description: string }) => void;
  initial?: StrategyLogic;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nodes, setNodes] = useState<StrategyNode[]>(
    initial?.nodes ?? []
  );

  function addBlock(template: (typeof BLOCK_TEMPLATES)[0]) {
    const id = `node-${nodeId++}`;
    setNodes([
      ...nodes,
      {
        id,
        type: "condition",
        label: template.label,
        data: { ...template.data } as Record<string, string | number | boolean>,
        position: { x: 0, y: nodes.length * 80 },
      },
    ]);
  }

  function removeNode(id: string) {
    setNodes(nodes.filter((n) => n.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <input
          className="flex h-11 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm"
          placeholder="Strategy name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="flex h-11 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div>
        <p className="mb-3 text-sm text-[#B0B0B0]">Add logic blocks</p>
        <div className="flex flex-wrap gap-2">
          {BLOCK_TEMPLATES.map((t) => (
            <Button
              key={t.label}
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

      <div className="relative min-h-[300px] rounded-2xl border border-dashed border-white/[0.12] bg-white/[0.02] p-4">
        {nodes.length === 0 ? (
          <p className="flex h-[260px] items-center justify-center text-[#B0B0B0]">
            Drag blocks here or use templates above
          </p>
        ) : (
          <div className="space-y-3">
            {nodes.map((node, i) => (
              <motion.div
                key={node.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] p-4 backdrop-blur-xl"
              >
                <GripVertical className="h-4 w-4 text-[#B0B0B0]" />
                <div className="flex-1">
                  <p className="font-medium">{node.label}</p>
                  <p className="text-xs text-[#B0B0B0]">
                    IF {String(node.data.indicator)}{" "}
                    {String(node.data.operator)}{" "}
                    {node.data.threshold !== undefined
                      ? String(node.data.threshold)
                      : ""}{" "}
                    → {String(node.data.action)}
                  </p>
                </div>
                {i < nodes.length - 1 && (
                  <div className="hidden h-8 w-px bg-white/[0.12] sm:block" />
                )}
                <button
                  type="button"
                  onClick={() => removeNode(node.id)}
                  className="text-[#FF5252] hover:opacity-80"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Button
        className="w-full"
        disabled={!name || nodes.length === 0}
        onClick={() =>
          onSave(
            { nodes, edges: nodes.slice(0, -1).map((n, i) => ({
              id: `e-${i}`,
              source: n.id,
              target: nodes[i + 1].id,
            })) },
            { name, description }
          )
        }
      >
        Save Strategy
      </Button>
    </div>
  );
}
