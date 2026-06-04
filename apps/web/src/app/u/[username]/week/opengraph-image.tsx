import { ImageResponse } from "next/og";
import { getPortfolioShareCard } from "@/lib/share/share-card-data";
import { OgPortfolioCard, OgPrivateTeaser } from "@/lib/share/og-card";

export const alt = "Auxano performance card";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const card = await getPortfolioShareCard(username, "week", null);

  if (!card) {
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 48,
            background: "#1a1209",
            color: "#ffedd8",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Auxano
        </div>
      ),
      { ...size }
    );
  }

  if (!card.visible) {
    return new ImageResponse(<OgPrivateTeaser username={card.username} />, { ...size });
  }

  return new ImageResponse(<OgPortfolioCard data={card} />, { ...size });
}
