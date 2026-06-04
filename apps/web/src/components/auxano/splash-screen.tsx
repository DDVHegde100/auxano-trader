"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 400);
    const t2 = setTimeout(() => setPhase(2), 1200);
    const t3 = setTimeout(onComplete, 2200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--background)]"
      animate={{ opacity: phase === 2 ? 0 : 1 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="text-center"
      >
        <motion.div
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-[var(--border-strong)] bg-[var(--accent-muted)] shadow-[var(--shadow-glow)]"
          animate={{
            boxShadow: [
              "0 0 40px rgba(111, 69, 24, 0.15)",
              "0 0 64px rgba(188, 138, 95, 0.25)",
              "0 0 40px rgba(111, 69, 24, 0.15)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-3xl tracking-tight text-foreground">A</span>
        </motion.div>
        <h1 className="aux-h1 text-foreground">Auxano</h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 1 ? 1 : 0 }}
          className="mt-2 text-muted"
        >
          Grow intelligently
        </motion.p>
      </motion.div>
      <motion.div
        className="absolute bottom-16 h-1 w-32 overflow-hidden rounded-full bg-[var(--border-subtle)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= 1 ? 1 : 0 }}
      >
        <motion.div
          className="h-full bg-[var(--camel)]"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.4, ease: "easeInOut" }}
        />
      </motion.div>
    </motion.div>
  );
}
