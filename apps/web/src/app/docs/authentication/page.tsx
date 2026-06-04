import Link from "next/link";

export const metadata = {
  title: "Authentication — Auxano",
};

export default function AuthenticationDocsPage() {
  return (
    <div className="aux-container-narrow aux-stack py-16">
      <Link href="/" className="text-sm text-accent hover:underline">
        ← Home
      </Link>
      <header className="aux-section-header mt-6">
        <h1 className="aux-h1">Clerk authentication</h1>
        <p>How sign-up, sign-in, and email verification work in Auxano.</p>
      </header>

      <section className="aux-card space-y-4 text-sm text-muted">
        <h2 className="aux-h4 text-foreground">Sign-up vs sign-in</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-foreground">Sign-up</strong> (<code>/sign-up</code>)
            — new accounts → onboarding → dashboard.
          </li>
          <li>
            <strong className="text-foreground">Sign-in</strong> (<code>/sign-in</code>)
            — existing accounts → dashboard (onboarding only if not finished).
          </li>
        </ul>
      </section>

      <section className="aux-card space-y-4 text-sm text-muted">
        <h2 className="aux-h4 text-foreground">Email verification (Clerk Dashboard)</h2>
        <ol className="list-decimal space-y-2 pl-5">
          <li>Open Clerk Dashboard → your application.</li>
          <li>
            Go to <strong className="text-foreground">User &amp; authentication</strong> →{" "}
            <strong className="text-foreground">Email</strong>.
          </li>
          <li>
            Enable <strong className="text-foreground">Verify at sign-up</strong> if you
            want users to confirm email before access.
          </li>
          <li>
            Under <strong className="text-foreground">Paths</strong>, set sign-in URL{" "}
            <code>/sign-in</code>, sign-up <code>/sign-up</code>, after sign-in{" "}
            <code>/dashboard</code>, after sign-up <code>/onboarding</code>.
          </li>
          <li>
            Add your domains: <code>localhost:3000</code> (dev) and your Vercel
            production URL.
          </li>
        </ol>
      </section>

      <section className="aux-card space-y-4 text-sm text-muted">
        <h2 className="aux-h4 text-foreground">Production environment variables</h2>
        <pre className="overflow-x-auto rounded-xl bg-[var(--accent-muted)] p-4 text-xs text-foreground">
{`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
ALLOW_DEV_AUTH=false
NEXT_PUBLIC_ALLOW_DEV_AUTH=false`}
        </pre>
      </section>

      <section className="aux-card space-y-4 text-sm text-muted">
        <h2 className="aux-h4 text-foreground">Webhooks (optional)</h2>
        <p>
          Endpoint: <code>/api/webhooks/clerk</code> — event{" "}
          <code>user.created</code>. Set <code>CLERK_WEBHOOK_SECRET</code> from Clerk.
          Users are also created on first app visit if the webhook is not configured.
        </p>
      </section>

      <p className="text-sm">
        Full deployment guide:{" "}
        <a
          href="https://github.com/DDVHegde100/auxano-trader/blob/main/SETUP.md"
          className="text-accent hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          SETUP.md
        </a>
      </p>
    </div>
  );
}
