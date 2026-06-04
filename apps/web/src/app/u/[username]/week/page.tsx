import Link from "next/link";
import { notFound } from "next/navigation";
import { getPortfolioShareCard } from "@/lib/share/share-card-data";
import { PortfolioShareCardVisual } from "@/components/share/share-card-visual";
import { ShareCardActions } from "@/components/share/share-card-actions";
import { getPublicAppUrl } from "@/lib/share/public-url";
import type { Metadata } from "next";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const card = await getPortfolioShareCard(username, "week", null);
  const base = getPublicAppUrl();
  const url = `${base}/u/${username}/week`;

  if (!card) {
    return { title: "Trader not found · Auxano" };
  }

  if (!card.visible) {
    return {
      title: `@${username} on Auxano`,
      description: "Paper trading performance on Auxano",
      openGraph: { url, siteName: "Auxano" },
    };
  }

  const title = `@${username} · ${card.returnPct >= 0 ? "+" : ""}${card.returnPct.toFixed(2)}% (${card.periodLabel})`;
  const description = `Paper portfolio ${card.returnPct.toFixed(2)}% vs SPY ${card.spyReturnPct.toFixed(2)}% on Auxano. ${card.topStrategy ? `Top strategy: ${card.topStrategy.name}.` : ""} Simulated only.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "Auxano",
      type: "website",
      images: [{ url: card.imageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [card.imageUrl],
    },
  };
}

export default async function PublicWeekSharePage({ params }: Props) {
  const { username } = await params;
  const card = await getPortfolioShareCard(username, "week", null);
  if (!card) notFound();

  const shareText = card.visible
    ? `${card.displayName}'s ${card.periodLabel} paper return on Auxano`
    : `@${username} on Auxano`;

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-12">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(188,138,95,0.12),transparent_55%)]" />
      <div className="relative mx-auto max-w-xl space-y-8">
        <header className="text-center">
          <Link href="/" className="text-3xl font-semibold text-[var(--camel)]">
            Auxano
          </Link>
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">
            Algorithmic paper trading
          </p>
        </header>

        {card.visible ? (
          <>
            <PortfolioShareCardVisual data={card} />
            <ShareCardActions
              publicUrl={card.publicUrl}
              imageUrl={card.imageUrl}
              title={`${card.username}-week`}
              text={shareText}
            />
          </>
        ) : (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 text-center">
            <p className="text-lg font-medium">@{card.username}</p>
            <p className="mt-2 text-[var(--foreground-muted)]">
              This portfolio is private. Add them as a friend on Auxano to see performance.
            </p>
          </div>
        )}

        <div className="flex flex-col items-center gap-3 text-center">
          <Link
            href="/sign-up"
            className="rounded-xl bg-[var(--camel)] px-8 py-3 font-medium text-[#1a1209] transition-opacity hover:opacity-90"
          >
            Start paper trading — $100k virtual
          </Link>
          <Link href="/sign-in" className="text-sm text-[var(--foreground-muted)] hover:text-[var(--camel)]">
            Sign in
          </Link>
        </div>

        <p className="text-center text-[10px] text-[var(--foreground-muted)]/60">
          Simulated paper trading only. Not financial advice.
        </p>
      </div>
    </div>
  );
}
