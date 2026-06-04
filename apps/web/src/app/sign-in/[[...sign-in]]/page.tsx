"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { SignIn } from "@clerk/nextjs";
import { ClearSignupOnboardingCookie } from "@/components/auth/clear-signup-cookie";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DEV_MODE = process.env.NEXT_PUBLIC_ALLOW_DEV_AUTH === "true";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setupError = searchParams.get("error");
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
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-[var(--page-padding-x)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(188,138,95,0.1),transparent_55%)]" />
      <div className="relative w-full max-w-md aux-fade-in">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border-strong)] bg-[var(--accent-muted)] text-2xl text-accent">
            A
          </div>
          <h1 className="aux-h2">Welcome back</h1>
          <p className="mt-1 text-muted">Continue your growth journey</p>
        </div>

        {setupError === "database" && (
          <p className="mb-4 rounded-xl border border-[var(--border-strong)] bg-[var(--accent-muted)] px-4 py-3 text-center text-sm text-negative">
            Database unreachable. Run <code className="text-foreground">npm run db:setup</code> or
            fix Supabase in SETUP.md.
          </p>
        )}
        {setupError === "account" && (
          <p className="mb-4 text-center text-sm text-negative">
            Could not create your paper account. Try signing in again.
          </p>
        )}

        {DEV_MODE ? (
          <form onSubmit={devSignIn} className="aux-card space-y-4">
            <p className="text-center aux-caption">Local dev · paper trading only</p>
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
              <p className="text-center text-sm text-negative">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
            <p className="text-center aux-caption">
              <Link href="/" className="text-accent hover:underline">
                Back to home
              </Link>
            </p>
          </form>
        ) : (
          <>
          <ClearSignupOnboardingCookie />
          <SignIn
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            forceRedirectUrl="/dashboard"
            appearance={{
              variables: {
                colorBackground: "#2a1a0e",
                colorInputBackground: "rgba(26, 18, 9, 0.6)",
                colorInputText: "#ffedd8",
                colorText: "#ffedd8",
                colorTextSecondary: "#e7bc91",
                colorPrimary: "#bc8a5f",
                borderRadius: "12px",
              },
              elements: {
                card: "aux-card shadow-[var(--shadow-lg)]",
                formButtonPrimary: "aux-btn-primary",
              },
            }}
          />
          </>
        )}
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInContent />
    </Suspense>
  );
}
