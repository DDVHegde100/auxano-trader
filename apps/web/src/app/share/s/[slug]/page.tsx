import Link from "next/link";
import { notFound } from "next/navigation";
import { getStrategyShareCard } from "@/lib/share/share-card-data";
import { StrategyShareCardVisual } from "@/components/share/share-card-visual";
import { ShareCardActions } from "@/components/share/share-card-actions";
import { getPublicAppUrl } from "@/lib/share/public-url";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const card = await getStrategyShareCard(slug);
  const base = getPublicAppUrl();
  const url = `${base}/share/s/${slug}`;

  if (!card) return { title: "Strategy · Auxano" };

  const title = `${card.name} · Quant ${card.quantScore} · Auxano`;
  const description = `${card.category} strategy by @${card.creator.username}. Backtest ${card.historicalReturn.toFixed(1)}%. Paper trading simulation.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "Auxano",
      images: [{ url: card.imageUrl, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title, description, images: [card.imageUrl] },
  };
}

export default async function PublicStrategySharePage({ params }: Props) {
  const { slug } = await params;
  const card = await getStrategyShareCard(slug);
  if (!card) notFound();

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-12">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(188,138,95,0.1),transparent_50%)]" />
      <div className="relative mx-auto max-w-xl space-y-8">
        <header className="text-center">
          <Link href="/" className="text-3xl font-semibold text-[var(--camel)]">
            Auxano
          </Link>
        </header>

        <StrategyShareCardVisual data={card} />
        <ShareCardActions
          publicUrl={card.publicUrl}
          imageUrl={card.imageUrl}
          title={card.slug}
          text={`${card.name} on Auxano — Quant ${card.quantScore}`}
        />

        <div className="flex justify-center gap-4">
          <Link
            href={`/strategies/${card.slug}`}
            className="text-sm text-[var(--camel)] hover:underline"
          >
            View strategy in app
          </Link>
          <Link href="/sign-up" className="text-sm text-[var(--foreground-muted)] hover:underline">
            Join Auxano
          </Link>
        </div>
      </div>
    </div>
  );
}
