import { ImageResponse } from "next/og";
import { getStrategyShareCard } from "@/lib/share/share-card-data";
import { OgStrategyCard } from "@/lib/share/og-card";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const card = await getStrategyShareCard(slug);
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
          Auxano Strategy
        </div>
      ),
      { ...size }
    );
  }

  return new ImageResponse(<OgStrategyCard data={card} />, { ...size });
}
