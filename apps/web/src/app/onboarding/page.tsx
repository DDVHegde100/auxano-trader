"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/auxano/glass-card";
import {
  readOnboardingDraft,
  writeOnboardingDraft,
  clearOnboardingDraft,
  clearSignupOnboardingCookie,
} from "@/lib/onboarding-storage";

const STEPS = ["experience", "goals", "welcome"] as const;

const EXPERIENCE = [
  { value: "BEGINNER", label: "Beginner", desc: "New to investing" },
  { value: "INTERMEDIATE", label: "Intermediate", desc: "1–3 years" },
  { value: "ADVANCED", label: "Advanced", desc: "3+ years active" },
  { value: "PROFESSIONAL", label: "Professional", desc: "Industry experience" },
];

const RISK = [
  { value: "CONSERVATIVE", label: "Conservative" },
  { value: "MODERATE", label: "Moderate" },
  { value: "AGGRESSIVE", label: "Aggressive" },
  { value: "VERY_AGGRESSIVE", label: "Very Aggressive" },
];

const GOALS = [
  { value: "WEALTH_BUILDING", label: "Wealth Building" },
  { value: "INCOME_GENERATION", label: "Income" },
  { value: "CAPITAL_PRESERVATION", label: "Preservation" },
  { value: "LEARNING", label: "Learning" },
  { value: "RETIREMENT", label: "Retirement" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("there");
  const [form, setForm] = useState({
    investingExperience: "",
    riskTolerance: "",
    financialGoal: "",
  });

  const current = STEPS[step];

  useEffect(() => {
    const draft = readOnboardingDraft();
    if (draft) {
      setForm({
        investingExperience: draft.investingExperience,
        riskTolerance: draft.riskTolerance,
        financialGoal: draft.financialGoal,
      });
    }

    fetch("/api/user/onboarding", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => {
        if (d.onboardingComplete) {
          router.replace("/dashboard");
          return;
        }
        const u = d.user;
        const label =
          u?.name?.split(" ")[0] ||
          (u?.username ? `@${u.username}` : null);
        if (label) setDisplayName(label.replace(/^@/, ""));
      })
      .catch(() => {});
  }, [router]);

  useEffect(() => {
    if (
      form.investingExperience ||
      form.riskTolerance ||
      form.financialGoal
    ) {
      writeOnboardingDraft(form);
    }
  }, [form]);

  async function complete() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/user/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save preferences. Try again.");
        return;
      }
      clearOnboardingDraft();
      clearSignupOnboardingCookie();
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error — check that the server and database are running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] px-4">
      <div className="mb-8 flex gap-2">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1 w-12 rounded-full transition-colors ${
              i <= step ? "bg-[var(--camel)]" : "bg-white/[0.08]"
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="w-full max-w-lg"
        >
          {current === "experience" && (
            <GlassCard glow>
              <h2 className="text-2xl font-semibold">Investing experience</h2>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                Your username is already set from sign-up — we only need your preferences here.
              </p>
              <div className="mt-6 grid gap-3">
                {EXPERIENCE.map((e) => (
                  <button
                    key={e.value}
                    type="button"
                    onClick={() =>
                      setForm({ ...form, investingExperience: e.value })
                    }
                    className={`rounded-xl border p-4 text-left transition-all ${
                      form.investingExperience === e.value
                        ? "border-[var(--camel)]/50 bg-[var(--camel)]/10"
                        : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06]"
                    }`}
                  >
                    <p className="font-medium">{e.label}</p>
                    <p className="text-sm text-[var(--foreground-muted)]">{e.desc}</p>
                  </button>
                ))}
              </div>
              <Button
                className="mt-6 w-full"
                disabled={!form.investingExperience}
                onClick={() => setStep(1)}
              >
                Continue
              </Button>
            </GlassCard>
          )}

          {current === "goals" && (
            <GlassCard glow>
              <h2 className="text-2xl font-semibold">Risk & goals</h2>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">Risk tolerance</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {RISK.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setForm({ ...form, riskTolerance: r.value })}
                    className={`rounded-lg border px-4 py-2 text-sm ${
                      form.riskTolerance === r.value
                        ? "border-[var(--camel)]/50 bg-[var(--camel)]/10"
                        : "border-white/[0.08]"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <p className="mt-6 text-sm text-[var(--foreground-muted)]">Financial goal</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {GOALS.map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setForm({ ...form, financialGoal: g.value })}
                    className={`rounded-lg border px-4 py-2 text-sm ${
                      form.financialGoal === g.value
                        ? "border-[var(--camel)]/50 bg-[var(--camel)]/10"
                        : "border-white/[0.08]"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
              <Button
                className="mt-6 w-full"
                disabled={!form.riskTolerance || !form.financialGoal}
                onClick={() => setStep(2)}
              >
                Continue
              </Button>
            </GlassCard>
          )}

          {current === "welcome" && (
            <GlassCard glow className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--camel)]/20 text-3xl"
              >
                ✓
              </motion.div>
              <h2 className="text-3xl font-semibold">Welcome, {displayName}</h2>
              <p className="mt-3 text-[var(--foreground-muted)]">
                Your paper trading account is funded with{" "}
                <span className="font-semibold text-[var(--camel)]">$100,000</span>{" "}
                virtual capital.
              </p>
              {error && (
                <p className="mt-4 text-center text-sm text-negative">{error}</p>
              )}
              <Button
                className="mt-8 w-full"
                size="lg"
                onClick={complete}
                disabled={loading}
              >
                {loading ? "Setting up..." : "Enter Auxano"}
              </Button>
            </GlassCard>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
