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
    <div className="relative min-h-screen overflow-hidden bg-[#111111]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[#00C853]/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-[#C7C7C7]/5 blur-[100px]" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] font-bold backdrop-blur-xl">
            A
          </div>
          <span className="text-xl font-semibold">Auxano</span>
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

      <main className="relative z-10 mx-auto max-w-4xl px-6 pb-24 pt-12 text-center md:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 text-sm text-[#B0B0B0] backdrop-blur-xl">
            <Sparkles className="h-4 w-4 text-[#00C853]" />
            Paper trading only · v1
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-[#F5F5F5] md:text-6xl">
            The algorithmic
            <br />
            <span className="bg-gradient-to-r from-[#00C853] to-[#C7C7C7] bg-clip-text text-transparent">
              investment OS
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-[#B0B0B0]">
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
              desc: "Visual no-code blocks for RSI, MA crosses, and profit targets.",
            },
            {
              icon: Shield,
              title: "Paper Trading",
              desc: "$100K virtual funds. Realistic simulation. Zero financial risk.",
            },
            {
              icon: Sparkles,
              title: "Quant Score",
              desc: "0–1000 rating across risk, returns, Sharpe, and consistency.",
            },
          ].map((f, i) => (
            <div
              key={f.title}
              className="glass rounded-2xl p-6 transition-transform hover:scale-[1.02]"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <f.icon className="mb-3 h-6 w-6 text-[#00C853]" />
              <h3 className="font-semibold text-[#F5F5F5]">{f.title}</h3>
              <p className="mt-2 text-sm text-[#B0B0B0]">{f.desc}</p>
            </div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
