"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  delay?: number;
}

export function GlassCard({
  children,
  className,
  glow = false,
  delay = 0,
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-2xl",
        glow && "shadow-[0_0_40px_rgba(199,199,199,0.08)]",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
