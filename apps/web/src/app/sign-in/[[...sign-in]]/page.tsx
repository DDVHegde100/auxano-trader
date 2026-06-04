"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DEV_MODE = process.env.NEXT_PUBLIC_ALLOW_DEV_AUTH === "true";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("test@gmail.com");
  const [password, setPassword] = useState("Test1234!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function devSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/dev-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Sign in failed");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Could not reach API. Is the server running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111111] px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,200,83,0.12),transparent_55%)]" />
      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-2xl font-bold backdrop-blur-2xl">
            A
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-[#B0B0B0]">Continue your growth journey</p>
        </div>

        {DEV_MODE ? (
          <form
            onSubmit={devSignIn}
            className="glass space-y-4 rounded-2xl p-6 shadow-2xl"
          >
            <p className="text-center text-xs text-[#B0B0B0]">
              Local dev · paper trading only
            </p>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="email"
            />
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
            />
            {error && (
              <p className="text-center text-sm text-[#FF5252]">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
            <p className="text-center text-xs text-[#B0B0B0]">
              <Link href="/" className="text-[#00C853] hover:underline">
                Back to home
              </Link>
            </p>
          </form>
        ) : (
          <SignIn
            appearance={{
              variables: {
                colorBackground: "#1A1A1A",
                colorInputBackground: "rgba(255,255,255,0.04)",
                colorInputText: "#F5F5F5",
                colorText: "#F5F5F5",
                colorTextSecondary: "#B0B0B0",
                colorPrimary: "#00C853",
                borderRadius: "12px",
              },
              elements: {
                card: "bg-white/[0.04] border border-white/[0.08] backdrop-blur-2xl shadow-2xl",
                formButtonPrimary: "bg-[#F5F5F5] text-[#111111] hover:bg-white",
              },
            }}
          />
        )}
      </div>
    </div>
  );
}
