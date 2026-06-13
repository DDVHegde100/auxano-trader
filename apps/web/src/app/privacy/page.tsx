export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-[var(--foreground)]">
      <h1 className="mb-2 text-3xl font-semibold">Privacy Policy</h1>
      <p className="mb-8 text-sm text-[var(--muted-foreground)]">Last updated: June 2026</p>
      <section className="space-y-4 text-[var(--muted-foreground)] leading-relaxed">
        <p>
          Auxano (&quot;we&quot;) operates a paper-trading simulation platform. This policy describes
          how we handle information when you use our web and mobile apps.
        </p>
        <h2 className="text-lg font-medium text-[var(--foreground)]">Information we collect</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>Account data: email, display name, and profile via Clerk authentication.</li>
          <li>Usage data: simulated trades, strategies, portfolio, and social interactions.</li>
          <li>Device tokens: optional push notification tokens if you enable alerts.</li>
        </ul>
        <h2 className="text-lg font-medium text-[var(--foreground)]">How we use data</h2>
        <p>
          We use your information to operate the service, personalize your experience, deliver
          notifications you opt into, and maintain leaderboards and social features. We do not
          sell personal information.
        </p>
        <h2 className="text-lg font-medium text-[var(--foreground)]">Market data</h2>
        <p>
          Quotes and prices are simulated or delayed for educational purposes. They are not
          suitable for real trading decisions.
        </p>
        <h2 className="text-lg font-medium text-[var(--foreground)]">Contact</h2>
        <p>
          Questions: reach us through the Auxano web app support channels. You may request account
          deletion by signing out and contacting support.
        </p>
      </section>
    </main>
  );
}
