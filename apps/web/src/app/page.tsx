"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Shield, LineChart } from "lucide-react";
import { SplashScreen } from "@/components/auxano/splash-screen";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--background)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[rgba(111,69,24,0.12)] blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-[rgba(188,138,95,0.06)] blur-[100px]" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-[var(--page-padding-x)] py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-strong)] bg-[var(--accent-muted)] text-lg text-accent">
            A
          </div>
          <span className="text-xl text-foreground">Auxano</span>
        </div>
        <div className="flex gap-3">
          <Link href="/sign-in">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-4xl px-[var(--page-padding-x)] pb-24 pt-12 text-center md:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="aux-pill mx-auto mb-6 inline-flex">
            <Sparkles className="h-4 w-4 text-accent" />
            Paper trading only · v1
          </p>
          <h1 className="aux-h1 text-4xl md:text-6xl">
            The algorithmic
            <br />
            <span className="text-gradient-accent">investment OS</span>
          </h1>
          <p className="aux-body mx-auto mt-6 max-w-xl text-lg">
            Create, backtest, and simulate quantitative strategies with $100,000
            virtual capital. No brokerage. Pure intelligence.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/sign-up">
              <Button size="lg" className="min-w-[200px]">
                Start growing
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button variant="secondary" size="lg" className="min-w-[200px]">
                Sign in
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-20 grid gap-4 text-left sm:grid-cols-3"
        >
          {[
            {
              icon: LineChart,
              title: "Strategy Builder",
              desc: "Visual blocks or Python — backtested before you publish.",
            },
            {
              icon: Shield,
              title: "Paper Trading",
              desc: "$100K virtual funds. Live prices. Zero financial risk.",
            },
            {
              icon: Sparkles,
              title: "Quant Score",
              desc: "0–1000 rating across risk, returns, Sharpe, and consistency.",
            },
          ].map((f) => (
            <div key={f.title} className="aux-card aux-card-interactive">
              <f.icon className="mb-3 h-6 w-6 text-accent" />
              <h3 className="aux-h4">{f.title}</h3>
              <p className="mt-2 aux-caption">{f.desc}</p>
            </div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
