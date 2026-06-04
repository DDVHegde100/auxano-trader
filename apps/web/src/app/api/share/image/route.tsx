import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import {
  getPortfolioShareCard,
  getStrategyShareCard,
  type SharePeriod,
} from "@/lib/share/share-card-data";
import {
  OgPortfolioCard,
  OgStrategyCard,
  OgPrivateTeaser,
} from "@/lib/share/og-card";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const type = url.searchParams.get("type") ?? "portfolio";

  if (type === "strategy") {
    const slug = url.searchParams.get("slug");
    if (!slug) {
      return new Response("Missing slug", { status: 400 });
    }
    const card = await getStrategyShareCard(slug);
    if (!card) return new Response("Not found", { status: 404 });

    return new ImageResponse(<OgStrategyCard data={card} />, {
      width: 1200,
      height: 630,
    });
  }

  const username = url.searchParams.get("username");
  if (!username) {
    return new Response("Missing username", { status: 400 });
  }
  const period = (url.searchParams.get("period") === "30d" ? "30d" : "week") as SharePeriod;
  const card = await getPortfolioShareCard(username, period, null);

  if (!card) return new Response("Not found", { status: 404 });

  if (!card.visible) {
    return new ImageResponse(<OgPrivateTeaser username={card.username} />, {
      width: 1200,
      height: 630,
    });
  }

  return new ImageResponse(<OgPortfolioCard data={card} />, {
    width: 1200,
    height: 630,
  });
}
