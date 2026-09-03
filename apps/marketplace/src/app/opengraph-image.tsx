import { ImageResponse } from "next/og";

export const alt = "KYP — rewards from the shops around you";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/* Tokens from packages/ui/src/tokens.css; the OG renderer cannot read CSS variables. */
const paper = "#faf8f3";
const ink = "#18120c";
const accentStrong = "#8f5510";
const muted = "#6f6359";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: paper,
          color: ink,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 160, fontWeight: 700, letterSpacing: -6, color: accentStrong }}>
          KYP
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", fontSize: 54, fontWeight: 700, letterSpacing: -1.5, maxWidth: 900, lineHeight: 1.1 }}>
            Rewards from the shops around you
          </div>
          <div style={{ display: "flex", fontSize: 26, color: muted, letterSpacing: 4, textTransform: "uppercase" }}>
            kyp.ph · Metro Manila
          </div>
        </div>
      </div>
    ),
    size,
  );
}
