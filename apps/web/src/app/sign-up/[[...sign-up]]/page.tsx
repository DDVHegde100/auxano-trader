import Link from "next/link";
import { SignUp } from "@clerk/nextjs";

export const dynamic = "force-dynamic";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(188,138,95,0.08),transparent_50%)]" />
      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border-strong)] bg-[var(--accent-muted)] text-2xl font-bold text-accent">
            A
          </div>
          <h1 className="aux-h2">Join Auxano</h1>
          <p className="mt-1 text-muted">$100,000 virtual capital · paper trading only</p>
        </div>
        <p className="mb-4 text-center text-xs text-muted">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-accent hover:underline">
            Sign in
          </Link>
          {" · "}
          <Link href="/docs/authentication" className="text-accent hover:underline">
            Auth help
          </Link>
        </p>
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          forceRedirectUrl="/onboarding"
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
              socialButtonsBlockButton:
                "border border-[var(--border-default)] bg-[var(--accent-muted)]",
              formButtonPrimary: "aux-btn-primary",
              footerActionLink: "text-accent",
            },
          }}
        />
      </div>
    </div>
  );
}
