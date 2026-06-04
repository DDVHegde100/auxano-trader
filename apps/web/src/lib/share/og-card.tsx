/* @jsxImportSource react */
import { seriesToSvgPath } from "@/lib/share/chart-path";
import type { PortfolioShareCard, StrategyShareCard } from "@/lib/share/share-card-data";
import { SHARE_DISCLAIMER } from "@/lib/share/share-card-data";

function formatPct(n: number) {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

function DualChart({
  portfolioPath,
  spyPath,
  width,
  height,
}: {
  portfolioPath: string;
  spyPath: string;
  width: number;
  height: number;
}) {
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path
        d={spyPath}
        fill="none"
        stroke="rgba(199,199,199,0.55)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d={portfolioPath}
        fill="none"
        stroke="#bc8a5f"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function OgPortfolioCard({ data }: { data: PortfolioShareCard }) {
  const w = 1080;
  const h = 200;
  const portVals = data.equityCurve.map((p) => p.value);
  const spyVals = data.spyCurve.map((p) => p.value);
  const portPath = seriesToSvgPath(portVals, w, h);
  const spyPath = seriesToSvgPath(spyVals, w, h);
  const positive = data.returnPct >= 0;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(145deg, #1a1209 0%, #2a1a0e 45%, #1a1209 100%)",
        color: "#ffedd8",
        fontFamily: "system-ui, sans-serif",
        padding: 56,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: "rgba(188,138,95,0.25)",
            border: "1px solid rgba(188,138,95,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            fontWeight: 700,
            color: "#bc8a5f",
          }}
        >
          A
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 28, opacity: 0.75 }}>Auxano · Paper Trading</span>
          <span style={{ fontSize: 42, fontWeight: 700 }}>@{data.username}</span>
        </div>
      </div>

      <div style={{ display: "flex", marginTop: 40, gap: 48 }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 22, opacity: 0.65 }}>{data.periodLabel} return</span>
          <span
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: positive ? "#6ee7a8" : "#f87171",
              lineHeight: 1.1,
            }}
          >
            {formatPct(data.returnPct)}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 22, opacity: 0.65 }}>vs SPY</span>
          <span style={{ fontSize: 48, fontWeight: 600, color: "#e7bc91" }}>
            {formatPct(data.alphaVsSpy)} alpha
          </span>
          <span style={{ fontSize: 20, opacity: 0.55, marginTop: 8 }}>
            SPY {formatPct(data.spyReturnPct)}
          </span>
        </div>
        {data.topStrategy && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "16px 24px",
              borderRadius: 16,
              border: "1px solid rgba(188,138,95,0.35)",
              background: "rgba(188,138,95,0.12)",
            }}
          >
            <span style={{ fontSize: 18, opacity: 0.65 }}>Top strategy</span>
            <span style={{ fontSize: 26, fontWeight: 600 }}>{data.topStrategy.name}</span>
            <span style={{ fontSize: 20, color: "#bc8a5f" }}>
              Quant {data.topStrategy.quantScore}
            </span>
          </div>
        )}
      </div>

      <div style={{ marginTop: 32, flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", gap: 24, fontSize: 18, opacity: 0.7 }}>
          <span style={{ color: "#bc8a5f" }}>● Portfolio</span>
          <span style={{ color: "#C7C7C7" }}>● SPY benchmark</span>
        </div>
        <DualChart portfolioPath={portPath} spyPath={spyPath} width={w} height={h} />
      </div>

      <span style={{ fontSize: 16, opacity: 0.45, marginTop: 12 }}>{SHARE_DISCLAIMER}</span>
    </div>
  );
}

export function OgStrategyCard({ data }: { data: StrategyShareCard }) {
  const w = 1080;
  const h = 200;
  const vals = data.equityCurve.map((p) => p.value);
  const spyVals = data.spyCurve.map((p) => p.value);
  const portPath = seriesToSvgPath(vals, w, h);
  const spyPath = seriesToSvgPath(spyVals, w, h);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(145deg, #111111 0%, #2a1a0e 50%, #111111 100%)",
        color: "#ffedd8",
        fontFamily: "system-ui, sans-serif",
        padding: 56,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <span style={{ fontSize: 26, opacity: 0.7 }}>Auxano Strategy</span>
          <div style={{ fontSize: 52, fontWeight: 700, marginTop: 8 }}>{data.name}</div>
          <span style={{ fontSize: 22, opacity: 0.65 }}>
            {data.category} · by @{data.creator.username ?? "trader"}
          </span>
        </div>
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            border: "4px solid #bc8a5f",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 44,
            fontWeight: 700,
            color: "#bc8a5f",
          }}
        >
          {data.quantScore}
        </div>
      </div>

      <div style={{ display: "flex", gap: 40, marginTop: 36 }}>
        <div>
          <span style={{ fontSize: 20, opacity: 0.6 }}>Backtest return</span>
          <div style={{ fontSize: 56, fontWeight: 700, color: "#6ee7a8" }}>
            {formatPct(data.historicalReturn)}
          </div>
        </div>
        {data.maxDrawdown != null && (
          <div>
            <span style={{ fontSize: 20, opacity: 0.6 }}>Max drawdown</span>
            <div style={{ fontSize: 40, fontWeight: 600 }}>{formatPct(-Math.abs(data.maxDrawdown))}</div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 24, flex: 1 }}>
        <DualChart portfolioPath={portPath} spyPath={spyPath} width={w} height={h} />
      </div>

      <span style={{ fontSize: 16, opacity: 0.45 }}>{SHARE_DISCLAIMER}</span>
    </div>
  );
}

export function OgPrivateTeaser({ username }: { username: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#1a1209",
        color: "#ffedd8",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ fontSize: 64, fontWeight: 700, color: "#bc8a5f" }}>Auxano</div>
      <div style={{ fontSize: 36, marginTop: 16 }}>@{username}</div>
      <div style={{ fontSize: 24, opacity: 0.6, marginTop: 24 }}>
        Paper trading performance · Join to compete
      </div>
    </div>
  );
}
