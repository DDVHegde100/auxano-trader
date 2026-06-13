export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-[var(--foreground)]">
      <h1 className="mb-2 text-3xl font-semibold">Terms of Service</h1>
      <p className="mb-8 text-sm text-[var(--muted-foreground)]">Last updated: June 2026</p>
      <section className="space-y-4 text-[var(--muted-foreground)] leading-relaxed">
        <p>
          By using Auxano you agree to these terms. Auxano provides simulated paper trading for
          education and entertainment only.
        </p>
        <h2 className="text-lg font-medium text-[var(--foreground)]">Not financial advice</h2>
        <p>
          Nothing on Auxano constitutes investment, financial, or tax advice. Virtual balances
          and trades have no real-world monetary value. Past simulated performance does not
          predict future results.
        </p>
        <h2 className="text-lg font-medium text-[var(--foreground)]">Eligibility</h2>
        <p>You must be at least 13 years old. You are responsible for safeguarding your account.</p>
        <h2 className="text-lg font-medium text-[var(--foreground)]">Acceptable use</h2>
        <p>
          Do not abuse the platform, attempt to manipulate leaderboards, scrape data at scale, or
          use the service for unlawful purposes. We may suspend accounts that violate these terms.
        </p>
        <h2 className="text-lg font-medium text-[var(--foreground)]">Disclaimer</h2>
        <p>
          The service is provided &quot;as is&quot; without warranties. We do not guarantee uptime,
          quote accuracy, or fitness for a particular purpose.
        </p>
      </section>
    </main>
  );
}
