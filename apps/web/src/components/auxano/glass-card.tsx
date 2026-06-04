"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  delay?: number;
  interactive?: boolean;
}

export function GlassCard({
  children,
  className,
  glow = false,
  delay = 0,
  interactive = false,
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "aux-card",
        glow && "aux-card-glow",
        interactive && "aux-card-interactive cursor-pointer",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
